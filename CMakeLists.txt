CMAKE_MINIMUM_REQUIRED(VERSION 3.10)

PROJECT(arc)

# A minimum set of build options that we need from gmsh
SET(ENABLE_BUILD_LIB ON CACHE BOOL "" FORCE)
SET(ENABLE_ALGLIB OFF CACHE BOOL "" FORCE)
SET(ENABLE_ANN OFF CACHE BOOL "" FORCE)
SET(ENABLE_BAMG ON CACHE BOOL "" FORCE)
SET(ENABLE_BLOSSOM OFF CACHE BOOL "" FORCE)
SET(ENABLE_CAIRO OFF CACHE BOOL "" FORCE)
SET(ENABLE_CGNS OFF CACHE BOOL "" FORCE)
SET(ENABLE_DINTEGRATION OFF CACHE BOOL "" FORCE)
SET(ENABLE_DOMHEX OFF CACHE BOOL "" FORCE)
SET(ENABLE_FLTK OFF CACHE BOOL "" FORCE)
SET(ENABLE_GEOMETRYCENTRAL OFF CACHE BOOL "" FORCE)
SET(ENABLE_GETDP OFF CACHE BOOL "" FORCE)
SET(ENABLE_GMM OFF CACHE BOOL "" FORCE)
SET(ENABLE_GMP OFF CACHE BOOL "" FORCE)
SET(ENABLE_GRAPHICS OFF CACHE BOOL "" FORCE)
SET(ENABLE_HXT OFF CACHE BOOL "" FORCE)
SET(ENABLE_KBIPACK OFF CACHE BOOL "" FORCE)
SET(ENABLE_MATHEX ON CACHE BOOL "" FORCE)
SET(ENABLE_MED OFF CACHE BOOL "" FORCE)
SET(ENABLE_METIS OFF CACHE BOOL "" FORCE)
SET(ENABLE_MMG OFF CACHE BOOL "" FORCE)
SET(ENABLE_MPEG_ENCODE OFF CACHE BOOL "" FORCE)
SET(ENABLE_MPI OFF CACHE BOOL "" FORCE)
SET(ENABLE_NETGEN OFF CACHE BOOL "" FORCE)
SET(ENABLE_NUMPY OFF CACHE BOOL "" FORCE)
SET(ENABLE_OCC OFF CACHE BOOL "" FORCE)
SET(ENABLE_OCC_CAF OFF CACHE BOOL "" FORCE)
SET(ENABLE_OCC_STATIC OFF CACHE BOOL "" FORCE)
SET(ENABLE_ONELAB_METAMODEL OFF CACHE BOOL "" FORCE)
SET(ENABLE_OPENMP OFF CACHE BOOL "" FORCE)
SET(ENABLE_OPTHOM OFF CACHE BOOL "" FORCE)
SET(ENABLE_PACKAGE_STRIP OFF CACHE BOOL "" FORCE)
SET(ENABLE_PRIVATE_API ON CACHE BOOL "" FORCE)
SET(ENABLE_PRO OFF CACHE BOOL "" FORCE)
SET(ENABLE_QUADMESHINGTOOLS OFF CACHE BOOL "" FORCE)
SET(ENABLE_QUADTRI OFF CACHE BOOL "" FORCE)
SET(ENABLE_RPATH OFF CACHE BOOL "" FORCE)
SET(ENABLE_SLEPC OFF CACHE BOOL "" FORCE)
SET(ENABLE_SOLVER OFF CACHE BOOL "" FORCE)
SET(ENABLE_TESTS OFF CACHE BOOL "" FORCE)
SET(ENABLE_TOUCHBAR OFF CACHE BOOL "" FORCE)
SET(ENABLE_VOROPP OFF CACHE BOOL "" FORCE)
SET(ENABLE_WINSLOWUNTANGLER OFF CACHE BOOL "" FORCE)

INCLUDE(FetchContent)

FetchContent_Declare(gmsh
  GIT_REPOSITORY https://gitlab.onelab.info/gmsh/gmsh.git
  GIT_TAG gmsh_4_12_2
  GIT_SHALLOW ON
  GIT_PROGRESS ON
  )

message(STATUS "Cloning gmsh sources")
FetchContent_MakeAvailable(gmsh)

FetchContent_GetProperties(gmsh
  SOURCE_DIR GMSH_SRC_DIR
  BINARY_DIR GMSH_BINARY_DIR
  )

add_library(arclib ${CMAKE_CURRENT_SOURCE_DIR}/cpp/lib.cpp)
add_executable(main ${CMAKE_CURRENT_SOURCE_DIR}/cpp/main.cpp)

# This is not very elegant, but gmsh is not yet using
# target_include_directories syntax yet, so the required include folders are
# not going to be captured by target_link_libraries(main PUBLIC lib) later. So
# we need to manually add the includes from gmsh here
target_include_directories(arclib PUBLIC
  ${GMSH_SRC_DIR}/src/common
  ${GMSH_SRC_DIR}/src/fltk
  ${GMSH_SRC_DIR}/src/geo
  ${GMSH_SRC_DIR}/src/graphics
  ${GMSH_SRC_DIR}/src/mesh
  ${GMSH_SRC_DIR}/src/solver
  ${GMSH_SRC_DIR}/src/numeric
  ${GMSH_SRC_DIR}/src/parser
  ${GMSH_SRC_DIR}/src/plugin
  ${GMSH_SRC_DIR}/src/post
  ${GMSH_SRC_DIR}/api
  ${GMSH_BINARY_DIR}/src/common
  )
target_link_libraries(arclib PUBLIC lib)
target_link_libraries(main PUBLIC arclib)

add_custom_command(TARGET main
  POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_SOURCE_DIR}/data/out.lvk88 ${CMAKE_BINARY_DIR})

IF(EMSCRIPTEN)

  # Download u2netp
  if(NOT EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/data/u2netp.onnx)
    MESSAGE(STATUS "Downloading u2netp.onnx...")
    file(DOWNLOAD https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx ${CMAKE_CURRENT_SOURCE_DIR}/data/u2netp.onnx)
  else()
    MESSAGE(STATUS "u2netp.onnx found in data folder")
  endif()

  set_target_properties(main
    PROPERTIES
    SUFFIX ".html"
    )
  target_compile_options(main PUBLIC
    -sNO_DISABLE_EXCEPTION_CATCHING)
  target_link_options(main PUBLIC
    -sINITIAL_MEMORY=67108864
    --preload-file ${CMAKE_SOURCE_DIR}/data/out.lvk88@out.lvk88)

  add_executable(emarclib ${CMAKE_CURRENT_SOURCE_DIR}/cpp/bindings.cpp)
  target_link_libraries(emarclib PUBLIC arclib)
  target_link_options(emarclib PUBLIC 
    -lembind
    -sINITIAL_MEMORY=536870912
    --embind-emit-tsd emarclib-types.d.ts
    -sMODULARIZE=1
    -sEXPORT_ES6=1
    -sENVIRONMENT='web'
    )

  set_target_properties(emarclib
    PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/pkg)

ENDIF()
