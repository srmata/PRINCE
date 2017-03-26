// Jose M Rico
// March 15, 2017
// node_main.cpp

// Main entry point for the Node.js addon interface.
// Only this file should know anything about Node and V8.

#include "node_main.h"

#include <node.h>

#include <cstdio>
#include <stdarg.h>

#include "load_data.h"

// TODO port to nan for compatibility and robustness.
using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void DEBUG_error(const char* format, ...)
{
  const int MSG_MAX_LENGTH = 1024;
  const char* MSG_PREFIX = "ERROR (DBG): ";
  Isolate* isolate = Isolate::GetCurrent();
  char msg[MSG_MAX_LENGTH];

  int cx = snprintf(msg, MSG_MAX_LENGTH, "%s", MSG_PREFIX);
  if (cx < 0)
    isolate->ThrowException(Exception::Error(String::NewFromUtf8(isolate,
      "ERROR (DBG): received error, failed to parse message (oh the irony)")));

  va_list args;
  va_start(args, format);
  int cx2 = vsnprintf(msg + cx, MSG_MAX_LENGTH - cx, format, args);
  va_end(args);
  if (cx2 < 0)
    isolate->ThrowException(Exception::Error(String::NewFromUtf8(isolate,
      "ERROR (DBG): received error, failed to parse message (oh the irony)")));

  if ((cx + cx2) >= MSG_MAX_LENGTH)
    printf("WARNING (DBG): error message too long, truncated\n");

  isolate->ThrowException(Exception::Error(String::NewFromUtf8(isolate, msg)));
}

static const char* to_c_string(const String::Utf8Value& value)
{
  return *value ? *value : "STRING CONVERSION FAILED";
}

static void load_file(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = args.GetIsolate();

  // Check for valid arguments.
  if (args.Length() != 4)
  {
    DEBUG_error("load_file expected 4 arguments");
    return;
  }
  if (!args[0]->IsString())
  {
    DEBUG_error("arg 1 should be a string (file path)");
    return;
  }
  if (!args[1]->IsInt32())
  {
    DEBUG_error("arg 2 should be an int (dimension)");
    return;
  }
  if (!args[2]->IsInt32())
  {
    DEBUG_error("arg 3 should be an int (parameter ID)");
    return;
  }
  if (!args[3]->IsArray())
  {
    DEBUG_error("arg 4 should be an array (coord types)");
    return;
  }
  Local<v8::Array> array = Local<v8::Array>::Cast(args[3]);
  if (array->Length() != 2)
  {
    DEBUG_error("arg 4 array length is %d, but should be 2", array->Length());
    return;
  }
  if (!array->Get(0)->IsInt32() || !array->Get(1)->IsInt32())
  {
    DEBUG_error("arg 4 array elements should be integers");
    return;
  }
  int a0 = array->Get(0)->Int32Value();
  int a1 = array->Get(1)->Int32Value();
  if (a0 < COORD_NONE || a0 > COORD_Z || a1 < COORD_NONE || a1 > COORD_Z)
  {
    DEBUG_error("arg 4 array elements should be valid CoordType enum values");
    return;
  }

  // Translate arguments for load procedure.
  String::Utf8Value string(args[0]);
  const char* cstring = to_c_string(string);
  int dataDim = args[1]->Int32Value();
  int paramID = args[2]->Int32Value();
  CoordType coordTypes[2] = { (CoordType)a0, (CoordType)a1 };

  if (!load_data(cstring, dataDim, paramID, coordTypes))
  {
    args.GetReturnValue().Set(String::NewFromUtf8(isolate, "FAILED"));
  }
  else
  {
    args.GetReturnValue().Set(String::NewFromUtf8(isolate, "Success"));
  }
}

static void init(Local<Object> exports)
{
  NODE_SET_METHOD(exports, "load_file", load_file);
}

NODE_MODULE(main, init)
