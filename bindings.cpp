#include "lib.hpp"

#include <cstdint>
#include <emscripten/bind.h>

lvk88::arc::SizedSingleChannelImage* createSizedSingleImageFromJSArray(int width, int height, emscripten::val js_data)
{
  std::vector<std::uint8_t> data = emscripten::vecFromJSArray<std::uint8_t>(js_data);
  lvk88::arc::SizedSingleChannelImage* result = new lvk88::arc::SizedSingleChannelImage();
  result->width = width;
  result->height = height;
  result->data = data;
  return result;
}

EMSCRIPTEN_BINDINGS(emarclib)
{
  emscripten::class_<lvk88::arc::SizedSingleChannelImage>("SizedSingleChannelImage")
    .constructor<>()
    .constructor(&createSizedSingleImageFromJSArray)
    .property("width", &lvk88::arc::SizedSingleChannelImage::width)
    .property("height", &lvk88::arc::SizedSingleChannelImage::height)
    .property("data", &lvk88::arc::SizedSingleChannelImage::data);

  emscripten::class_<lvk88::arc::EdgeMesh>("EdgeMesh")
    .property("nodeCoordinates", &lvk88::arc::EdgeMesh::nodeCoordinates)
    .property("edgeNodes", &lvk88::arc::EdgeMesh::edgeNodes );

  emscripten::function("mesh_image", &lvk88::arc::mesh_image);
  emscripten::register_vector<std::uint8_t>("Uint8Vector");
  emscripten::register_vector<double>("DoubleVector");
  emscripten::register_vector<std::size_t>("SizeTVector");
}
