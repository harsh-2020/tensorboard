load("//tensorboard/defs:defs.bzl", "tf_ts_library")
load("@npm_angular_bazel//:index.bzl", "ng_module")

package(default_visibility = ["//tensorboard:internal"])

ng_module(
    name = "error",
    srcs = [
        "error_module.ts",
    ],
    deps = [
        "//tensorboard/webapp/error/store",
        "//tensorboard/webapp/error/views:error_snackbar",
        "@npm//@angular/core",
        "@npm//@ngrx/store",
    ],
)

tf_ts_library(
    name = "types",
    srcs = [
        "types.ts",
    ],
)
