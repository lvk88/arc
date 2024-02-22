#include "lib.hpp"

#include "gmsh.h"
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
  int height = customImage.width;
  int width = customImage.height;

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
    new PView(d);
    return 1;
  }
  else {
    delete d;
    return 0;
  }
}

}

EdgeMesh mesh_image(const SizedSingleChannelImage& img)
{
  gmsh::initialize();

  EndPos("image.lvk88", Img2Data(img));

  gmsh::plugin::setString("ModifyComponents", "Expression0", "1 + v0^3 * 10");
  gmsh::plugin::run("ModifyComponents");

  int bg_field = gmsh::model::mesh::field::add("PostView");
  gmsh::model::mesh::field::setNumber(bg_field, "ViewIndex", 0);
  gmsh::model::mesh::field::setAsBackgroundMesh(bg_field);

  double w;
  gmsh::view::option::getNumber(1, "MaxX", w);

  double h;
  gmsh::view::option::getNumber(1, "MaxY", h);

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

  gmsh::model::mesh::generate(2);

  gmsh::model::mesh::createEdges();

  std::vector<size_t> nodeTags;
  std::vector<double> coords;
  std::vector<double> parametricCoords;
  gmsh::model::mesh::getNodes(nodeTags, coords, parametricCoords);
  
  std::vector<size_t> edgeTags;
  std::vector<size_t> edgeNodes;
  gmsh::model::mesh::getAllEdges(edgeTags, edgeNodes);

  gmsh::finalize();

  return EdgeMesh{coords, edgeNodes};
}


}
}
