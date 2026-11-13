// 手动运行一次，只修改当前选择；订阅地址全部留在主配置中。
(function () {
  "use strict";
  var selector = "✈️ 机场选择";
  var blocked = "⛔️ 拒绝";
  var airports = {
    "🛫 TERO": "TERO",
    "🛫 SSRDOG": "SSRDOG",
    "🛫 兔子": "兔子",
    "🛫 哆啦A梦": "哆啦A梦",
    "🛫 Kitty Network": "Kitty Network"
  };
  var entries = [
    { group: "🇭🇰 香港节点", flag: "🇭🇰", name: "香港节点" },
    { group: "🇨🇳 台湾节点", flag: "🇨🇳", name: "台湾节点" },
    { group: "🇸🇬 狮城节点", flag: "🇸🇬", name: "狮城节点" },
    { group: "🇯🇵 日本节点", flag: "🇯🇵", name: "日本节点" },
    { group: "🇺🇲 美国节点", flag: "🇺🇲", name: "美国节点" }
  ];
  var finished = false;

  function finish(success, message) {
    if (finished) return;
    finished = true;
    console.log((success ? "成功：" : "未完成：") + message);
    $notification.post("机场联动", success ? "已同步" : "同步未完成", message);
    $done();
  }

  function failClosed(message) {
    // 只保护五个地区入口，不修改三个全机场手动组。
    var failed = [];
    entries.forEach(function (entry) {
      try {
        if (!$surge.setSelectGroupPolicy(entry.group, blocked)) failed.push(entry.group);
      } catch (_) {
        failed.push(entry.group);
      }
    });
    finish(false, message + (failed.length
      ? "；未能保护这些入口，请检查：" + failed.join("、")
      : "；五个地区入口已设为拒绝，请检查后重新运行。"));
  }

  try {
    var before = $surge.selectGroupDetails();
    if (!before.groups || !before.groups[selector]) {
      finish(false, "当前配置没有机场选择组，请启用桃子机场集.conf配置。");
      return;
    }
    var selected = before.decisions[selector] || before.groups[selector][0];
    var airport = airports[selected];
    if (typeof airport !== "string") {
      finish(false, "无法识别所选机场，请先在机场选择中选一个机场。");
      return;
    }

    // selectGroupDetails 不包含 smart 组的成员，必须另查全部策略组。
    $httpAPI("GET", "/v1/policy_groups", null, function (groups) {
      var transactionStarted = false;
      try {
        if (!groups || groups.error || typeof groups !== "object") {
          finish(false, "无法读取全部策略组，未修改任何入口。");
          return;
        }
        var current = $surge.selectGroupDetails();
        var nowSelected = current.decisions[selector] || current.groups[selector][0];
        if (nowSelected !== selected) {
          finish(false, "运行期间机场选择发生变化，请重新运行。");
          return;
        }
        var plan = entries.map(function (entry) {
          var target = entry.flag + " " + airport + " · " + entry.name;
          var options = current.groups[entry.group];
          if (!options || options.indexOf(blocked) < 0) {
            throw new Error("配置与脚本不匹配：" + entry.group);
          }
          // 某些机场在配置中没有该地区的专属组，应安全地选择拒绝。
          var exists = options.indexOf(target) >= 0;
          var members = exists ? groups[target] : [];
          if (exists && !Array.isArray(members)) {
            throw new Error("无法读取机场专属组：" + target);
          }
          if (!Array.isArray(members)) {
            members = [];
          }
          if (members.some(function (member) { return member.isGroup; })) {
            throw new Error("机场专属组仍包含策略组而不是真实节点：" + target);
          }
          var available = members.some(function (member) {
            return member.enabled !== false &&
              member.typeDescription !== "DIRECT" && member.typeDescription !== "REJECT";
          });
          return { entry: entry.group, name: entry.name, target: available ? target : blocked, empty: !available };
        });
        var touched = false;
        for (var i = 0; i < plan.length; i++) {
          var item = plan[i];
          if (current.decisions[item.entry] !== item.target) {
            touched = true;
            transactionStarted = true;
            if (!$surge.setSelectGroupPolicy(item.entry, item.target)) {
              failClosed("入口切换失败：" + item.entry);
              return;
            }
          }
        }
        var after = $surge.selectGroupDetails();
        if (plan.some(function (item) { return after.decisions[item.entry] !== item.target; })) {
          failClosed("入口切换后的状态校验失败");
          return;
        }
        var empty = plan.filter(function (item) { return item.empty; })
          .map(function (item) { return item.name; });
        finish(true, airport + "机场：" + (touched ? "五个地区入口已同步。" : "地区入口已一致，无需重复切换。") +
          (empty.length ? "\n以下分类暂无匹配节点，已拒绝：" + empty.join("、") +
            "。订阅更新后请再次运行。" : ""));
      } catch (error) {
        if (transactionStarted) failClosed(error.message || String(error));
        else finish(false, error.message || String(error));
      }
    });
  } catch (error) {
    finish(false, error.message || String(error));
  }
})();
