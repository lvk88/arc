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

void mesh_image(const SizedSingleChannelImage& img);

}
}
