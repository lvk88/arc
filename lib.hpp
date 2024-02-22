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

// Not a complete mesh, just a bunch of nodes
// and edges connecting these nodes
struct EdgeMesh
{
  std::vector<double> nodeCoordinates;
  std::vector<std::size_t> edgeNodes;
};

EdgeMesh mesh_image(const SizedSingleChannelImage& img);

}
}
