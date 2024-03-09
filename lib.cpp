#include "lib.hpp"

#include "GmshMessage.h"
#include "gmsh.h"
#include "GmshGlobal.h"
#include "PView.h"
#include "PViewDataList.h"

#include <string.h>

namespace lvk88
{
namespace arc
{

namespace
{

// This function is copied and adjusted from ReadImg.cpp
PViewDataList *Img2Data(const SizedSingleChannelImage& customImage)
{
  const unsigned char *data = customImage.data.data();
  int width = customImage.width;
  int height = customImage.height;

  PViewDataList *d = new PViewDataList();

  double z = 0.;
  for(int i = 0; i < height - 1; i++) {
    const unsigned char *a = data + i * width;
    const unsigned char *a1 = data + (i + 1) * width;
    double y = height - i - 1;
    double y1 = height - i - 2;
    for(int j = 0; j < width - 1; j++) {
      double x = j;
      double x1 = j + 1;
      double val1 = (double)a[j] / 255.;
      double val2 = (double)a1[j] / 255.;
      double val3 = (double)a1[(j + 1)] / 255.;
      double val4 = (double)a[(j + 1)] / 255.;
        d->SQ.push_back(x);
        d->SQ.push_back(x);
        d->SQ.push_back(x1);
        d->SQ.push_back(x1);
        d->SQ.push_back(y);
        d->SQ.push_back(y1);
        d->SQ.push_back(y1);
        d->SQ.push_back(y);
        d->SQ.push_back(z);
        d->SQ.push_back(z);
        d->SQ.push_back(z);
        d->SQ.push_back(z);
        d->SQ.push_back(val1);
        d->SQ.push_back(val2);
        d->SQ.push_back(val3);
        d->SQ.push_back(val4);
        d->NbSQ++;
    }
  }
  return d;
}

// This function is copied and adjusted from ReadImg.cpp
int EndPos(const char *name, PViewData *d)
{
  if(!d) return 0;
  char name_pos[256], title[256];
  strcpy(name_pos, name);
  strcat(name_pos, ".pos");
  int i;
  for(i = strlen(name) - 1; i >= 0; i--) {
    if(name[i] == '/' || name[i] == '\\') break;
  }
  if(i <= 0)
    strcpy(title, name);
  else
    strcpy(title, &name[i + 1]);
  d->setName(title);
  d->setFileName(name_pos);
  if(d->finalize()) {
    // This is different from gmsh code. We return the tag of the view here,
    // so that we can refer to it later.
    auto* view = new PView(d);
    return view->getTag();
  }
  else {
    delete d;
    return 0;
  }
}

class MessageHandler : public GmshMessage
{
  public:
  MessageHandler() = default;
  ~MessageHandler() = default;

  void operator()(std::string level, std::string message) override
  {
    std::cout << "Got GMSH message [" << level << "]" << message << std::endl;
  }
};

}

EdgeMesh mesh_image(const SizedSingleChannelImage& img, const MeshOptions& mesh_options)
{
  gmsh::initialize();

  MessageHandler handler;

  GmshSetMessageHandler(&handler);

  //gmsh::option::setNumber("General.Verbosity", 99);

  auto view_tag = EndPos("image.lvk88", Img2Data(img));

  gmsh::plugin::setString("ModifyComponents", "Expression0", "1 + v0^3 * 10");
  gmsh::plugin::run("ModifyComponents");

  int bg_field = gmsh::model::mesh::field::add("PostView");
  gmsh::model::mesh::field::setNumber(bg_field, "ViewIndex", 0);
  gmsh::model::mesh::field::setAsBackgroundMesh(bg_field);

  double w;
  gmsh::view::option::getNumber(view_tag, "MaxX", w);

  double h;
  gmsh::view::option::getNumber(view_tag, "MaxY", h);

  int point_1 = gmsh::model::geo::addPoint(0.0, 0.0, 0.0, w);
  int point_2 = gmsh::model::geo::addPoint(w, 0.0, 0.0, w);
  int point_3 = gmsh::model::geo::addPoint(w, h, 0.0, w);
  int point_4 = gmsh::model::geo::addPoint(0.0, h, 0.0, w);

  int line_1 = gmsh::model::geo::addLine(point_1, point_2);
  int line_2 = gmsh::model::geo::addLine(point_2, point_3);
  int line_3 = gmsh::model::geo::addLine(point_3, point_4);
  int line_4 = gmsh::model::geo::addLine(point_4, point_1);

  int loop = gmsh::model::geo::addCurveLoop({line_3, line_4, line_1, line_2});
  gmsh::model::geo::addPlaneSurface({loop});

  gmsh::model::geo::synchronize();

  gmsh::option::setNumber("Mesh.Algorithm", mesh_options.algorithm);
  gmsh::option::setNumber("Mesh.MeshSizeFactor", mesh_options.mesh_size_factor);
  gmsh::option::setNumber("Mesh.MeshSizeMin", mesh_options.mesh_size_min);

  gmsh::model::mesh::generate(2);

  gmsh::model::mesh::createEdges();

  std::vector<size_t> nodeTags;
  std::vector<double> coords;
  std::vector<double> parametricCoords;
  gmsh::model::mesh::getNodes(nodeTags, coords, parametricCoords);

  // The i-th node coordinates in coords does not correspond to the node with
  // tag `i`. Therefore, we reorder the node coordinates here, such that they
  // are in the order of the tag numbers
  size_t max_node_tag = 0;
  gmsh::model::mesh::getMaxNodeTag(max_node_tag);
  std::vector<double> coords_in_tag_order(3 * (max_node_tag + 1));
  for(int i = 0; i < nodeTags.size(); ++i)
  {
    const auto& current_tag = nodeTags[i];
    const double x = coords[3 * i];
    const double y = coords[3 * i + 1];
    const double z = coords[3 * i + 2];
    coords_in_tag_order[3 * current_tag] = x;
    coords_in_tag_order[3 * current_tag + 1] = y;
    coords_in_tag_order[3 * current_tag + 2] = z;
  }
  
  std::vector<size_t> edgeTags;
  std::vector<size_t> edgeNodes;
  gmsh::model::mesh::getAllEdges(edgeTags, edgeNodes);

  gmsh::finalize();

  return EdgeMesh{coords_in_tag_order, edgeNodes};
}


}
}
