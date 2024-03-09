#include "lib.hpp"

#include <stdexcept>
#include <filesystem>
#include <fstream>
#include <iostream>

namespace 
{

lvk88::arc::SizedSingleChannelImage read_lvk88(const std::string& fileName)
{
  if(!std::filesystem::exists(fileName))
  {
    throw std::runtime_error("File doesn't exist");
  }

  std::ifstream file{fileName, std::ios::binary};

  if(!file.is_open())
  {
    throw std::runtime_error("Could not open file");
  }

  unsigned char magic_number = 0;

  file.read(reinterpret_cast<char*>(&magic_number), sizeof(unsigned char));

  std::cout << "Read magic number: " << std::hex << static_cast<int>(magic_number) << std::dec << std::endl;

  std::int32_t w = -1;
  std::int32_t h = -1;

  file.read(reinterpret_cast<char*>(&w), sizeof(std::int32_t));
  file.read(reinterpret_cast<char*>(&h), sizeof(std::int32_t));

  std::cout << "Read w x h = " << w << " x " << h << std::endl;

  std::vector<std::uint8_t> img_data(w * h);

  file.read(reinterpret_cast<char*>(img_data.data()), w * h * sizeof(std::uint16_t));

  std::cout << "Value of first pixel: " << static_cast<int>(img_data[0]) << std::endl;

  return lvk88::arc::SizedSingleChannelImage{w, h, img_data};
}

}


int main(int argc, char** argv)
{
  const auto& img = read_lvk88("out.lvk88");

  lvk88::arc::MeshOptions default_options;

  lvk88::arc::mesh_image(img, default_options);
  lvk88::arc::mesh_image(img, default_options);

  return 0;
}
