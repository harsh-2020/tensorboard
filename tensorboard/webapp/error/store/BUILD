load("//tensorboard/defs:defs.bzl", "tf_ts_library")

package(default_visibility = ["//tensorboard:internal"])

tf_ts_library(
    name = "store",
    srcs = [
        "error_reducers.ts",
        "error_selectors.ts",
        "index.ts",
    ],
    deps = [
        ":types",
        "//tensorboard/webapp/error:types",
        "//tensorboard/webapp/error/actions",
        "@npm//@ngrx/store",
    ],
)

tf_ts_library(
    name = "types",
    srcs = [
        "error_types.ts",
    ],
    deps = [
        "//tensorboard/webapp/error:types",
    ],
)

tf_ts_library(
    name = "testing",
    testonly = True,
    srcs = ["testing.ts"],
    deps = [
        ":types",
    ],
)

tf_ts_library(
    name = "test_lib",
    testonly = True,
    srcs = [
        "error_reducers_test.ts",
        "error_selectors_test.ts",
    ],
    deps = [
        ":store",
        ":testing",
        ":types",
        "//tensorboard/webapp/error/actions",
        "@npm//@types/jasmine",
    ],
)
