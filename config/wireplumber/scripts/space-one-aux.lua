local cutils = require("common-utils")
local log = Log.open_topic("s-space-one-aux")
local sink_name = "alsa_output.pci-0000_80_1f.3.analog-stereo"
local bluetooth_match = "~bluez_output.F4_9D_8A_1C_BE_F6.*"
local graph_key = "audioconvert.filter-graph.0"
local graph
local applied = {}

for _, raw_rule in ipairs(Conf.get_section_as_json("node.filter-graph.rules", Json.Array{}):parse(1)) do
  local rule = Json.Raw(raw_rule):parse(1)
  for _, raw_match in ipairs(Json.Raw(rule.matches):parse(1)) do
    local match = Json.Raw(raw_match):parse(1)
    if match["node.name"] == bluetooth_match then
      local actions = Json.Raw(rule.actions):parse(1)
      local graphs = Json.Raw(actions["create-filter-graph"]):parse(1)
      assert(#graphs == 1, "Space One AUX requires exactly one Bluetooth EQ graph")
      graph = graphs[1]
    end
  end
end
assert(graph, "Space One Bluetooth EQ graph not found")

local function update_node(node, device)
  if node.properties["node.name"] ~= sink_name then
    return
  end
  local enabled = false
  if device then
    for param in device:iterate_params("Route") do
      local route = cutils.parseParam(param, "Route")
      if route and route.device == tonumber(node.properties["card.profile.device"])
          and route.name == "analog-output-headphones" and route.available ~= "no" then
        enabled = true
      end
    end
  end
  if enabled == (applied[node.id] == true) then
    return
  end
  node:set_params("Props", Pod.Object {
    "Spa:Pod:Object:Param:Props", "Props",
    params = Pod.Struct { graph_key, enabled and graph or Pod.None() }
  })
  applied[node.id] = enabled or nil
  log:info(node, enabled and "Space One AUX EQ enabled on headphones" or "Space One AUX EQ removed from analog output")
end

SimpleEventHook {
  name = "space-one-aux/node-added",
  interests = {
    EventInterest {
      Constraint { "event.type", "=", "node-added" },
      Constraint { "node.name", "=", sink_name, type = "pw" },
    },
  },
  execute = function(event)
    local node = event:get_subject()
    local device = cutils.get_object_manager("device"):lookup {
      Constraint { "bound-id", "=", node.properties["device.id"], type = "gobject" },
    }
    update_node(node, device)
  end,
}:register()

SimpleEventHook {
  name = "space-one-aux/routes-changed",
  interests = {
    EventInterest {
      Constraint { "event.type", "=", "device-params-changed" },
      Constraint { "event.subject.param-id", "=", "Route" },
    },
  },
  execute = function(event)
    local device = event:get_subject()
    for node in cutils.get_object_manager("node"):iterate() do
      if tonumber(node.properties["device.id"]) == tonumber(device["bound-id"]) then
        update_node(node, device)
      end
    end
  end,
}:register()

SimpleEventHook {
  name = "space-one-aux/node-removed",
  interests = {
    EventInterest {
      Constraint { "event.type", "=", "node-removed" },
    },
  },
  execute = function(event)
    applied[event:get_subject().id] = nil
  end,
}:register()
