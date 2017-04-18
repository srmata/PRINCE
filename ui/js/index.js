// Jose M Rico
// March 8, 2017
// index.js
// Main script for index.html

// Load native C++ module.
const cppmain = require("../cpp/build/Release/main");

// Chrome-style tabs global variable
let chromeTabs = null;

function ParamFromName(name)
{
  for (let i = 0; i < plasmaParams.length; i++) {
    if (plasmaParams[i]["name"] === name)
      return plasmaParams[i];
  }
  return null;
}

function ParamFromAlias(alias)
{
  for (let i = 0; i < plasmaParams.length; i++) {
    if (plasmaParams[i]["alias"] === name)
      return plasmaParams[i];
  }
  return null;
}

function DispRelFromName(name)
{
  for (let i = 0; i < dispRels.length; i++) {
    if (dispRels[i]["name"] === name)
      return dispRels[i];
  }
  return null;
}

/* Toggle between hiding and showing the dropdown content */
function ToggleDropdown()
{
  $("#dispDropdown").toggle();
}

/* Dispersion relation has been selected. */
function DispSelect(event)
{
  var dispRelName = $(event.target).text();
  var dispRelInfo = DispRelFromName(dispRelName);

  // Update dropdown button text.
  $("#dropdownButton").text(dispRelName);

  // Reorder plasma parameters.
  for (let i = 0; i < plasmaParams.length; i++)
    $("#" + plasmaParams[i]["alias"]).appendTo($("#other"));

  for (let i = 0; i < dispRelInfo["req"].length; i++)
    $("#" + dispRelInfo["req"][i]).appendTo($("#required"));
}

function FileChange(event)
{
  // TODO change parameter coords in CPP when x/y/z or x,y/y,z/x,z option change

  // TODO undesired/annoying behavior: click "Select File" button again when
  // dialog is open causes another file upload window to pop up after.
  const dialog = require("electron").remote.dialog;
  var files = dialog.showOpenDialog({ properties: [ 'openFile' ] });
  if (files == undefined)
    return;

  var filepath = files[0];
  var filename = filepath.replace(/^.*[\\\/]/, '');

  var parameter = $(event.target).closest(".parameter");
  var paramName = parameter.find(".paramName").text();
  var paramInfo = ParamFromName(paramName);
  var paramFilename = parameter.find(".paramFilename");

  var checkedRadioDim = parameter.find(".paramDataType").find("input:checked");
  var dataDim = 1;
  if (checkedRadioDim.attr("class") == "radio2D")
    dataDim = 2;

  var coordTypes = [-1, -1];
  if (dataDim == 1) {
    var checkedRadioFormat = parameter.find(".format1D").find("input:checked");
    if (checkedRadioFormat.attr("class") == "radioX")
      coordTypes[0] = 0;
    else if (checkedRadioFormat.attr("class") == "radioY")
      coordTypes[0] = 1;
    else if (checkedRadioFormat.attr("class") == "radioZ")
      coordTypes[0] = 2;
  }
  else {
    var checkedRadioFormat = parameter.find(".format2D").find("input:checked");
    if (checkedRadioFormat.attr("class") == "radioXY") {
      coordTypes[0] = 0;
      coordTypes[1] = 1;
    }
    if (checkedRadioFormat.attr("class") == "radioXZ") {
      coordTypes[0] = 0;
      coordTypes[1] = 2;
    }
    if (checkedRadioFormat.attr("class") == "radioYZ") {
      coordTypes[0] = 1;
      coordTypes[1] = 2;
    }
  }
  var success = cppmain.LoadParameter(paramInfo["alias"], filepath, dataDim, coordTypes);
  if (success) {
    paramFilename.text(filename);
  }
  else {
    console.log("FAILED");
    paramFilename.text("No file selected");
  }
}

function Load0D(paramInfo, valueStr)
{
  cppmain.LoadParameter(paramInfo["alias"], valueStr, 0, [-1, -1]);
}

function ParamBoxReset(param)
{
  var paramName = param.find(".paramName").text();
  var paramInfo = ParamFromName(paramName);
  cppmain.ClearParameter(paramInfo["alias"]);

  param.find(".paramDataValue").hide();
  param.find(".format1D").hide();
  param.find(".format2D").hide();
  param.find(".paramDataFile").hide();
  param.find(".paramFilename").text("No file selected");
  param.find(".paramPlot").hide();
}

// TODO factor 0-D, 1-D, and 2-D param UI elements into one div?
function Param0D(event)
{
  var param = $(event.target).closest(".parameter");
  ParamBoxReset(param);

  param.find(".paramDataValue").show();
}
function Param1D(event)
{
  var param = $(event.target).closest(".parameter");
  ParamBoxReset(param);

  param.find(".format1D").show();
  param.find(".paramDataFile").show();
  param.find(".paramPlot").show();
}
function Param2D(event)
{
  var param = $(event.target).closest(".parameter");
  ParamBoxReset(param);

  param.find(".format2D").show();
  param.find(".paramDataFile").show();
  param.find(".paramPlot").show();
}

$(function() {
  console.log("Starting PRINCE");
  console.log("Node version: " + process.versions.node);
  console.log("Chrome version: " + process.versions.chrome);
  console.log("Electron version: " + process.versions.electron);

  LoadFormats("ui/formats.json");

  // Initialize chrome tabs
  var chromeTabsEl = document.querySelector('.chrome-tabs');
  chromeTabs = new ChromeTabs();
  chromeTabs.init(chromeTabsEl, {
    tabOverlapDistance: 14,
    minWidth: 45,
    maxWidth: 243
  });

  $(chromeTabsEl).on("activeTabChange", function(data) {
    var tabEl = data.detail.tabEl;
    var tabName = $(tabEl).find(".chrome-tab-title").text();
    var paramInfo = ParamFromName(tabName);
    $(".tab-page").each(function() { $(this).hide(); });
    if (paramInfo === null)
      $("#" + tabName).show();
    else
      $("#tab-" + paramInfo["alias"]).show();
  });
  $(chromeTabsEl).on("tabAdd", function(data) {
    tabEl = data.detail.tabEl;
    var tabName = $(tabEl).find(".chrome-tab-title").text();
    if (tabName === "PRINCE")
      $(tabEl).find(".chrome-tab-close").remove();
  });
  $(chromeTabsEl).on("tabRemove", function(data) {
    tabEl = data.detail.tabEl;
    var tabName = $(tabEl).find(".chrome-tab-title").text();
    var paramInfo = ParamFromName(tabName);
    $("#tab-" + paramInfo["alias"]).remove();
  });

  chromeTabs.addTab({title: "PRINCE"});

  // Generate plasma parameter divs.
  var paramPrototype = $(".parameter");
  for (let i = 0; i < plasmaParams.length; i++) {
    let paramInfo = plasmaParams[i];
    let clone = paramPrototype.clone(true);
    clone.attr("id", paramInfo["alias"]);
    clone.appendTo(paramPrototype.parent());
    clone.find(".paramName").text(paramInfo["name"]);
    // Assign different names to each parameter's radio groups.
    clone.find(".paramDataType").find("input").each(function() {
      if ($(this).attr("type") == "radio")
        $(this).attr("name", "dataType-" + i);
    });
    clone.find(".format1D").find("input").each(function() {
      if ($(this).attr("type") == "radio")
        $(this).attr("name", "format1D-" + i);
    });
    clone.find(".format2D").find("input").each(function() {
      if ($(this).attr("type") == "radio")
        $(this).attr("name", "format2D-" + i);
    });

    // Hide data input, since the data type is still unset.
    clone.find(".paramDataValue").hide();
    clone.find(".format1D").hide();
    clone.find(".format2D").hide();
    clone.find(".paramDataFile").hide();
    clone.find(".paramPlot").hide();
  }
  paramPrototype.remove();

  // Add dispersion relations.
  for (let i = 0; i < dispRels.length; i++) {
    let dispRelName = dispRels[i]["name"];
    let $dispRelButton = $("<button>" + dispRelName + "</button>")
      .addClass("dispButton")
      .appendTo("#dispDropdown");
  }
  // Add click callbacks.
  $("#dropdownButton").click(ToggleDropdown);

  $(".dispButton").each(function() { $(this).click(DispSelect); });
  $(".paramFileButton").each(function() { $(this).click(FileChange); });
  $(".paramPlotButton").each(function() { $(this).click(ParamPlot); });

  $(".radio0D").each(function() { $(this).click(Param0D); });
  $(".radio1D").each(function() { $(this).click(Param1D); });
  $(".radio2D").each(function() { $(this).click(Param2D); });

  // Add sneaky lose-focus for 0-D input field.
  $(".submitHidden").each(function() {
    $(this).click(function() {
      var $paramValueField = $(this).parent().find(".paramValueField");
      $paramValueField.blur();
      var param = $(this).closest(".parameter");
      var paramName = param.find(".paramName").text();
      var paramInfo = ParamFromName(paramName);
      Load0D(paramInfo, $paramValueField.val());
    });
  });

  // Add calculated parameter buttons.
  for (let i = 0; i < calcParams.length; i++) {
    var $button = $("<button>" + calcParams[i]["name"] + "</button>");
    $button.appendTo($("#solverSettings"));
    $button.click(function(event) {
      var paramName = $(event.target).text();
      console.log(paramName);
    });
  }
});

$(window).click(function(event)
{
  // Close the dropdown menu if the user clicks outside of it.
  if (!$(event.target).is("#dropdownButton"))
    $(".dropdown-content").each(function() { $(this).hide(); });
});
