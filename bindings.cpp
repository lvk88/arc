#include "lib.hpp"

#include <emscripten/bind.h>

EMSCRIPTEN_BINDINGS(emarclib)
{
  emscripten::class_<lvk88::arc::SizedSingleChannelImage>("SizedSingleChannelImage")
    .constructor<>()
    .property("width", &lvk88::arc::SizedSingleChannelImage::width)
    .property("height", &lvk88::arc::SizedSingleChannelImage::height)
    .property("data", &lvk88::arc::SizedSingleChannelImage::data);

  emscripten::function("mesh_image", &lvk88::arc::mesh_image);
  emscripten::register_vector<std::uint8_t>("Uint8Vector");
}
