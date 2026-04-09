# 10 Weixin Connector Guide: Bind Personal WeChat To Uniresearch

This guide explains the built-in Uniresearch Weixin connector.

Uniresearch already includes the Weixin iLink runtime. You do not need to install OpenClaw, run `npx`, or configure a separate local bridge. The only required binding action is:

1. open `Settings > Connectors > WeChat`
2. click `Bind WeChat`
3. scan the QR code with WeChat
4. confirm the login inside WeChat

After confirmation, Uniresearch saves the Weixin connector automatically and starts long polling.

## 1. What this connector does

After binding succeeds, Uniresearch can:

- receive WeChat text messages
- receive WeChat image, video, and file attachments
- copy inbound attachments into the active quest under `userfiles/weixin/...`
- send text replies back to the same WeChat context
- send native WeChat images, videos, and files when the agent attaches a real local file
- send auto-generated metric timeline images after each recorded main experiment when WeChat is the bound quest connector

Inbound media is materialized into the quest, not kept only in an ephemeral connector cache. The current path shape is:

```text
~/Uniresearch/quests/<quest_id>/userfiles/weixin/<message_batch>/
```

That makes Weixin media behave much closer to the QQ path: the quest receives durable local files that the agent can read.

![Uniresearch Weixin binding overview](../images/weixin/weixin-settings-bind.svg)

## 2. Before you bind

Check these items first:

- Uniresearch daemon and web UI are already running
- you can open `Settings > Connectors > WeChat`
- you have a real personal WeChat account on the phone that will scan the QR code

This reference screenshot is only there to remind you to use the phone that already holds the target WeChat account. The actual binding still happens from the Uniresearch QR modal, not from a separate `npx` tool.

![WeChat app reference](../images/weixin/weixin-plugin-entry.png)

## 3. Bind from the Settings page

Open:

- [Settings > Connectors > WeChat](/settings/connectors#connector-weixin)

Then:

1. click `Bind WeChat`
2. wait for Uniresearch to generate the QR code
3. scan it with WeChat
4. confirm the login on the phone

Important points:

- the modal only shows the QR code because Uniresearch already knows the full iLink login flow
- there is no manual `bot_token` form during binding
- there is no extra Save button inside the QR modal
- when the platform returns `bot_token` and account ids, Uniresearch persists them automatically

After success, the WeChat card shows:

- `Bot account`
- `Owner account`

That is the saved connector binding.

![QR scan and confirmation flow](../images/weixin/weixin-qr-confirm.svg)

## 4. Verify with one text or media message

After the QR login succeeds:

1. bind a quest to the Weixin connector from `Start Research` or the project surface
2. send one text, image, video, or file message from WeChat
3. let Uniresearch ingest it into the quest
4. confirm the reply arrives in the same WeChat thread

Current behavior:

- inbound text enters the quest as the user message
- inbound image, video, and file attachments are downloaded and copied into quest-local `userfiles/weixin/...`
- media-only inbound messages are no longer dropped
- outbound text replies use the runtime-managed `context_token`
- if the WeChat `context_token` is missing or goes stale, low-priority outbound updates are queued instead of being dropped
- after the next inbound WeChat message refreshes the session, Uniresearch replays only the latest `5` queued updates, with a `2s` gap between sends
- outbound image, video, and file delivery works when the agent sends a real local file path
- outbound main-experiment metric charts are sent automatically as native WeChat images

![Quest-local media flow](../images/weixin/weixin-quest-media-flow.svg)

## 5. What the agent should do with Weixin media

For ordinary user guidance, the important rule is simple:

- if the agent only needs to answer with text, normal message replies are enough
- if the agent needs to send a native WeChat image, video, or file, it must send a real local file from the quest

In practice, that means the agent should prefer quest-local files such as:

```text
artifacts/...
experiments/...
paper/...
userfiles/...
```

instead of depending on an arbitrary external URL.

## 5.1 Automatic main-experiment metric charts

When WeChat is the bound quest connector, Uniresearch now auto-sends metric timeline charts after each recorded main experiment.

Current behavior:

- one chart per metric
- the baseline is drawn as a horizontal dashed reference line when a baseline value exists
- the system automatically respects whether the metric is `higher is better` or `lower is better`
- any point that beats baseline gets a star marker
- the latest point is filled with a deep Morandi red
- earlier points are filled with a deep Morandi blue
- if multiple metrics are present, Uniresearch sends them sequentially with about a 2 second gap

These charts are generated from quest-local files and delivered as native WeChat images in the bound thread.

## 6. Troubleshooting

### QR code keeps waiting

Check:

- the phone is scanning with the same WeChat account you want to bind
- the phone finished the confirmation step inside WeChat
- Uniresearch is still running while you wait

If the QR expires, Uniresearch refreshes it automatically.

### I only see text, but not inbound media

Re-test with a real image, video, or file. After a successful inbound media message, confirm that the quest now contains:

```text
userfiles/weixin/<message_batch>/manifest.json
```

and the copied media file next to it.

## 7. References

- Runoob personal WeChat guide: https://www.runoob.com/ai-agent/openclaw-weixin.html
- Upstream Weixin protocol reference: https://github.com/hao-ji-xing/openclaw-weixin/blob/main/weixin-bot-api.md
