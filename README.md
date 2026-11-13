# Surge Multi-Airport Link Script

`机场联动.js` synchronizes five regional select groups with the airport selected in the `✈️ 机场选择` group.

## Requirements

- Surge for Mac or iOS with the Surge scripting APIs used by this script.
- A configuration that provides the `✈️ 机场选择` group with options `🛫 TERO`, `🛫 SSRDOG`, `🛫 兔子`, `🛫 哆啦A梦`, `🛫 顺畅网络`, and `🛫 Kitty Network`.
- These five regional select groups: `🇭🇰 香港节点`, `🇨🇳 台湾节点`, `🇸🇬 狮城节点`, `🇯🇵 日本节点`, and `🇺🇲 美国节点`.
- Each regional group must include `⛔️ 拒绝`. Airport-specific smart groups are named `<flag> <airport> · <region>`; regions absent from the selected airport are set to `⛔️ 拒绝`.

The names and flag prefixes in the script must match the configuration. Edit the `airports` mapping and `entries` list in the script to adapt it.

## Behavior

- Run manually after changing the airport selection.
- Updates only the five regional select groups.
- Selects `⛔️ 拒绝` for a region when the selected airport has no usable nodes in that region or no matching airport-specific group.
- On a partial update failure, attempts to set all five regional groups to `⛔️ 拒绝`.
- Does not contain subscription URLs and does not change configuration files.

This script was developed for a specific configuration. Review and adapt the group names before using it in another setup.
