// Jose M Rico
// March 14, 2017
// build.js
// Node script that builds the C++ codebase according to the current platform.

function execCallback(err, stdout, stderr)
{
  if (err)
    console.log(stderr);

  console.log(stdout);
}

var exec = require("child_process").exec;

if (process.platform == "win32")
{
  console.log("Building C++ code for Windows");
  // TODO check this (we're not in this directory)
  exec("cpp\\win_build_cpp.bat", execCallback);
}

if (process.platform == "darwin")
{
  console.log("Building C++ code for Mac");
  exec("cpp/mac_build_cpp.sh", execCallback);
}
