#pragma once

#include <cstdint>
#include <vector>

namespace lvk88
{
namespace arc
{

struct SizedSingleChannelImage
{
  int width;
  int height;
  std::vector<std::uint8_t> data;
};

// From GmshDefines.h :
//#define ALGO_2D_MESHADAPT         1
//#define ALGO_2D_AUTO              2
//#define ALGO_2D_INITIAL_ONLY      3
//#define ALGO_2D_DELAUNAY          5
//#define ALGO_2D_FRONTAL           6
//#define ALGO_2D_BAMG              7
//#define ALGO_2D_FRONTAL_QUAD      8
//#define ALGO_2D_PACK_PRLGRMS      9
//#define ALGO_2D_PACK_PRLGRMS_CSTR 10
//#define ALGO_2D_QUAD_QUASI_STRUCT 11
struct MeshOptions
{
  double mesh_size_factor = 1.0;
  double mesh_size_min = 0.0;
  int algorithm = 6;
};

// Not a complete mesh, just a bunch of nodes
// and edges connecting these nodes
struct EdgeMesh
{
  std::vector<double> nodeCoordinates;
  std::vector<std::size_t> edgeNodes;
};

EdgeMesh mesh_image(const SizedSingleChannelImage& img, const MeshOptions& mesh_options);

}
}
