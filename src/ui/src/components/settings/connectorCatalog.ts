import {
  Bot,
  MessageCircleMore,
  MessagesSquare,
  RadioTower,
  Send,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'

export type ConnectorName = 'qq' | 'telegram' | 'discord' | 'slack' | 'feishu' | 'whatsapp'

export type ConnectorFieldKind = 'text' | 'password' | 'url' | 'boolean' | 'select' | 'list'

export type ConnectorField = {
  key: string
  label: string
  kind: ConnectorFieldKind
  readOnly?: boolean
  placeholder?: string
  description: string
  whereToGet: string
  docUrl?: string
  options?: Array<{ label: string; value: string }>
}

export type ConnectorSection = {
  id: string
  title: string
  description: string
  fields: ConnectorField[]
}

export type ConnectorCatalogEntry = {
  name: ConnectorName
  label: string
  subtitle: string
  icon: LucideIcon
  portalLabel: string
  portalUrl: string
  deliveryNote: string
  sections: ConnectorSection[]
}

const commonAccessFields: ConnectorField[] = [
  {
    key: 'dm_policy',
    label: 'Direct chat policy',
    kind: 'select',
    description: 'Controls whether direct messages auto-pair, require allowlists, or stay disabled.',
    whereToGet: 'Choose the access mode that matches your team policy.',
    options: [
      { label: 'Pairing', value: 'pairing' },
      { label: 'Allowlist', value: 'allowlist' },
      { label: 'Open', value: 'open' },
      { label: 'Disabled', value: 'disabled' },
    ],
  },
  {
    key: 'allow_from',
    label: 'Direct allowlist',
    kind: 'list',
    placeholder: 'user-a, user-b, *',
    description: 'Comma-separated sender ids allowed to message the bot directly.',
    whereToGet: 'Use your platform user ids or `*` for open mode.',
  },
  {
    key: 'group_policy',
    label: 'Group policy',
    kind: 'select',
    description: 'Controls whether group chats are allowlisted, open, or disabled.',
    whereToGet: 'Choose the access mode that matches your group rollout plan.',
    options: [
      { label: 'Allowlist', value: 'allowlist' },
      { label: 'Open', value: 'open' },
      { label: 'Disabled', value: 'disabled' },
    ],
  },
  {
    key: 'group_allow_from',
    label: 'Group allowlist',
    kind: 'list',
    placeholder: 'group-user-a, group-user-b',
    description: 'Comma-separated sender ids allowed inside groups.',
    whereToGet: 'Use sender ids captured from connector events or your relay logs.',
  },
  {
    key: 'groups',
    label: 'Group ids',
    kind: 'list',
    placeholder: 'group-1, group-2',
    description: 'Comma-separated target group ids for allowlist mode.',
    whereToGet: 'Copy the chat or guild/channel ids from the platform admin console.',
  },
  {
    key: 'auto_bind_dm_to_active_quest',
    label: 'Auto-bind DM to active quest',
    kind: 'boolean',
    description: 'If enabled, direct messages can automatically attach to the current active quest.',
    whereToGet: 'Enable when you want 1:1 chats to continue the most recent active quest.',
  },
]

const commonTransportFields: ConnectorField[] = [
  {
    key: 'mode',
    label: 'Connector mode',
    kind: 'select',
    description: 'Choose between direct credentials and relay/callback operation.',
    whereToGet: 'Use `relay` unless you have platform credentials for direct outbound sending.',
    options: [
      { label: 'Relay', value: 'relay' },
      { label: 'Direct', value: 'direct' },
    ],
  },
  {
    key: 'relay_url',
    label: 'Relay URL',
    kind: 'url',
    placeholder: 'https://relay.example.com/connectors/...',
    description: 'Optional relay endpoint used when outbound delivery is delegated.',
    whereToGet: 'Set this to your nanoclaw-style relay or connector sidecar endpoint.',
  },
  {
    key: 'relay_auth_token',
    label: 'Relay auth token',
    kind: 'password',
    placeholder: 'token-or-secret',
    description: 'Optional relay authorization token used for outbound delivery.',
    whereToGet: 'Copy from your relay deployment or reverse-proxy secret configuration.',
  },
  {
    key: 'public_callback_url',
    label: 'Public callback URL',
    kind: 'url',
    placeholder: 'https://public.example.com/api/connectors/...',
    description: 'Public inbound callback URL registered with the platform.',
    whereToGet: 'Use the webhook/callback URL you register in the platform console.',
  },
]

export const connectorCatalog: ConnectorCatalogEntry[] = [
  {
    name: 'telegram',
    label: 'Telegram',
    subtitle: 'Best for direct bot chats and simple webhook or polling bridges.',
    icon: Send,
    portalLabel: 'Telegram Bot docs',
    portalUrl: 'https://core.telegram.org/bots',
    deliveryNote: 'Supports active send tests when `bot_token` is configured or a relay can deliver outbound messages.',
    sections: [
      {
        id: 'identity',
        title: 'Bot credentials',
        description: 'Match the BotFather token and optional webhook secret.',
        fields: [
          {
            key: 'bot_name',
            label: 'Bot name',
            kind: 'text',
            placeholder: 'DeepScientist',
            description: 'Display name used by your local runtime.',
            whereToGet: 'Choose the local alias shown in messages and connector cards.',
          },
          {
            key: 'bot_token',
            label: 'Bot token',
            kind: 'password',
            placeholder: '123456:ABCDEF...',
            description: 'Direct HTTP token for `getMe` and outbound sends.',
            whereToGet: 'Create or reset it in BotFather.',
            docUrl: 'https://core.telegram.org/bots/tutorial',
          },
          {
            key: 'webhook_secret',
            label: 'Webhook secret',
            kind: 'password',
            placeholder: 'optional-secret',
            description: 'Optional secret used when Telegram calls your public webhook.',
            whereToGet: 'Set it when configuring the webhook endpoint.',
            docUrl: 'https://core.telegram.org/bots/webhooks',
          },
          {
            key: 'require_mention_in_groups',
            label: 'Require mention in groups',
            kind: 'boolean',
            description: 'Only process group messages that explicitly mention the bot.',
            whereToGet: 'Enable to reduce accidental trigger noise in shared groups.',
          },
        ],
      },
      {
        id: 'transport',
        title: 'Transport',
        description: 'Webhook/relay routing and command prefix.',
        fields: [
          ...commonTransportFields,
          {
            key: 'command_prefix',
            label: 'Command prefix',
            kind: 'text',
            placeholder: '/',
            description: 'Prefix used for connector-side commands such as `/use` or `/status`.',
            whereToGet: 'Usually keep `/` to match the web and TUI command surface.',
          },
        ],
      },
      {
        id: 'access',
        title: 'Access control',
        description: 'Who can talk to the bot directly or in groups.',
        fields: commonAccessFields,
      },
    ],
  },
  {
    name: 'discord',
    label: 'Discord',
    subtitle: 'Works well for guild-based collaboration with explicit bot mentions.',
    icon: MessageCircleMore,
    portalLabel: 'Discord Developer Portal',
    portalUrl: 'https://discord.com/developers/applications',
    deliveryNote: 'Direct identity checks work with `bot_token`; inbound chat often still needs a gateway bridge or sidecar.',
    sections: [
      {
        id: 'identity',
        title: 'App credentials',
        description: 'Bind the bot token and interaction verification keys.',
        fields: [
          {
            key: 'bot_name',
            label: 'Bot name',
            kind: 'text',
            placeholder: 'DeepScientist',
            description: 'Display name used by the local runtime.',
            whereToGet: 'Choose the local alias shown in the workspace and connector cards.',
          },
          {
            key: 'bot_token',
            label: 'Bot token',
            kind: 'password',
            placeholder: 'discord-bot-token',
            description: 'Bot token used for identity and direct outbound sending.',
            whereToGet: 'Copy it from the Bot tab in the Discord Developer Portal.',
            docUrl: 'https://discord.com/developers/applications',
          },
          {
            key: 'application_id',
            label: 'Application ID',
            kind: 'text',
            placeholder: '1234567890',
            description: 'Application/client id of the Discord bot.',
            whereToGet: 'Copy it from General Information in the developer portal.',
            docUrl: 'https://discord.com/developers/applications',
          },
          {
            key: 'public_key',
            label: 'Public key',
            kind: 'password',
            placeholder: 'public-key',
            description: 'Used to verify interaction signatures if you expose a callback endpoint.',
            whereToGet: 'Copy it from General Information in the developer portal.',
            docUrl: 'https://discord.com/developers/applications',
          },
          {
            key: 'require_mention_in_groups',
            label: 'Require mention in groups',
            kind: 'boolean',
            description: 'Only respond when the bot is mentioned in guild channels.',
            whereToGet: 'Enable for safer group collaboration.',
          },
        ],
      },
      {
        id: 'transport',
        title: 'Transport',
        description: 'Interaction URL, relay, and gateway-compatible settings.',
        fields: [
          ...commonTransportFields,
          {
            key: 'public_interactions_url',
            label: 'Interactions URL',
            kind: 'url',
            placeholder: 'https://public.example.com/api/connectors/discord/callback',
            description: 'Public interaction endpoint registered in the Discord portal.',
            whereToGet: 'Set it in the Discord Interaction Endpoint URL field.',
            docUrl: 'https://discord.com/developers/docs/interactions/receiving-and-responding',
          },
          {
            key: 'guild_allowlist',
            label: 'Guild allowlist',
            kind: 'list',
            placeholder: 'guild-1, guild-2',
            description: 'Optional comma-separated guild ids that are allowed to use the bot.',
            whereToGet: 'Copy guild ids from Discord developer mode or your relay logs.',
          },
        ],
      },
      {
        id: 'access',
        title: 'Access control',
        description: 'Configure DM and group-style policies.',
        fields: commonAccessFields,
      },
    ],
  },
  {
    name: 'slack',
    label: 'Slack',
    subtitle: 'Good for team workspaces with explicit app credentials and event subscriptions.',
    icon: MessagesSquare,
    portalLabel: 'Slack App dashboard',
    portalUrl: 'https://api.slack.com/apps',
    deliveryNote: 'Active send tests work when the bot token is valid; inbound verification also needs a signing secret.',
    sections: [
      {
        id: 'identity',
        title: 'App credentials',
        description: 'Connect your bot token and signing secret.',
        fields: [
          {
            key: 'bot_name',
            label: 'Bot name',
            kind: 'text',
            placeholder: 'DeepScientist',
            description: 'Local display name for Slack connector messages.',
            whereToGet: 'Choose the alias shown in DeepScientist surfaces.',
          },
          {
            key: 'bot_token',
            label: 'Bot token',
            kind: 'password',
            placeholder: 'xoxb-...',
            description: 'Bot user OAuth token used for direct API access.',
            whereToGet: 'Install the app and copy the Bot User OAuth Token from your Slack app.',
            docUrl: 'https://api.slack.com/apps',
          },
          {
            key: 'app_token',
            label: 'App token',
            kind: 'password',
            placeholder: 'xapp-...',
            description: 'Optional Socket Mode app token if you run Slack via a sidecar.',
            whereToGet: 'Create it under Basic Information → App-Level Tokens.',
            docUrl: 'https://api.slack.com/apps',
          },
          {
            key: 'signing_secret',
            label: 'Signing secret',
            kind: 'password',
            placeholder: 'signing-secret',
            description: 'Used to verify Slack inbound events and slash command requests.',
            whereToGet: 'Copy it from Basic Information in your Slack app.',
            docUrl: 'https://api.slack.com/apps',
          },
          {
            key: 'bot_user_id',
            label: 'Bot user id',
            kind: 'text',
            placeholder: 'U012345',
            description: 'Optional bot user id used for mention filtering or routing.',
            whereToGet: 'Read it from Slack auth.test or the app installation metadata.',
          },
        ],
      },
      {
        id: 'transport',
        title: 'Transport',
        description: 'Event subscription URL, relay, and command prefix.',
        fields: [
          ...commonTransportFields,
          {
            key: 'command_prefix',
            label: 'Command prefix',
            kind: 'text',
            placeholder: '/',
            description: 'Prefix used for connector-side commands.',
            whereToGet: 'Usually keep `/` to match the TUI and web commands.',
          },
          {
            key: 'require_mention_in_groups',
            label: 'Require mention in groups',
            kind: 'boolean',
            description: 'Only react to channel messages that mention the bot.',
            whereToGet: 'Recommended in shared Slack channels.',
          },
        ],
      },
      {
        id: 'access',
        title: 'Access control',
        description: 'Configure DM and channel access rules.',
        fields: commonAccessFields,
      },
    ],
  },
  {
    name: 'feishu',
    label: 'Feishu / Lark',
    subtitle: 'Good for enterprise collaboration with event subscription verification.',
    icon: Bot,
    portalLabel: 'Feishu Open Platform',
    portalUrl: 'https://open.feishu.cn/app',
    deliveryNote: 'Active send tests need a usable relay or app credentials; webhook verification also needs the verification token.',
    sections: [
      {
        id: 'identity',
        title: 'App credentials',
        description: 'Bind the internal app id, secret, and verification secrets.',
        fields: [
          {
            key: 'bot_name',
            label: 'Bot name',
            kind: 'text',
            placeholder: 'DeepScientist',
            description: 'Local display name for the Feishu connector.',
            whereToGet: 'Choose the alias shown in DeepScientist surfaces.',
          },
          {
            key: 'app_id',
            label: 'App ID',
            kind: 'text',
            placeholder: 'cli_xxx',
            description: 'Internal app id used for tenant token exchange.',
            whereToGet: 'Copy from your Feishu/Lark app credentials page.',
            docUrl: 'https://open.feishu.cn/app',
          },
          {
            key: 'app_secret',
            label: 'App secret',
            kind: 'password',
            placeholder: 'app-secret',
            description: 'Secret used for token exchange and app authentication.',
            whereToGet: 'Copy from your Feishu/Lark app credentials page.',
            docUrl: 'https://open.feishu.cn/app',
          },
          {
            key: 'verification_token',
            label: 'Verification token',
            kind: 'password',
            placeholder: 'verification-token',
            description: 'Used to verify webhook-style inbound callbacks.',
            whereToGet: 'Copy from Event Subscriptions in the Feishu Open Platform.',
            docUrl: 'https://open.feishu.cn/app',
          },
          {
            key: 'encrypt_key',
            label: 'Encrypt key',
            kind: 'password',
            placeholder: 'encrypt-key',
            description: 'Optional encryption key for encrypted Feishu event payloads.',
            whereToGet: 'Copy from Event Subscriptions in the Feishu Open Platform.',
            docUrl: 'https://open.feishu.cn/app',
          },
        ],
      },
      {
        id: 'transport',
        title: 'Transport',
        description: 'Callback endpoint, API base URL, relay, and mention settings.',
        fields: [
          ...commonTransportFields,
          {
            key: 'api_base_url',
            label: 'API base URL',
            kind: 'url',
            placeholder: 'https://open.feishu.cn',
            description: 'Base URL for direct Feishu API calls.',
            whereToGet: 'Normally keep the default Feishu Open Platform host.',
            docUrl: 'https://open.feishu.cn/app',
          },
          {
            key: 'require_mention_in_groups',
            label: 'Require mention in groups',
            kind: 'boolean',
            description: 'Only process group messages that mention the bot.',
            whereToGet: 'Recommended for noisy team chats.',
          },
        ],
      },
      {
        id: 'access',
        title: 'Access control',
        description: 'Control who can talk to the bot in direct and group chats.',
        fields: commonAccessFields,
      },
    ],
  },
  {
    name: 'whatsapp',
    label: 'WhatsApp',
    subtitle: 'Supports Meta Cloud API or relay mode for outbound message delivery.',
    icon: Smartphone,
    portalLabel: 'WhatsApp Cloud API docs',
    portalUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/',
    deliveryNote: 'Active send tests require Meta credentials plus phone number id, or a relay that can deliver outbound messages.',
    sections: [
      {
        id: 'identity',
        title: 'Provider credentials',
        description: 'Choose Meta Cloud API or relay mode and fill the essential credentials.',
        fields: [
          {
            key: 'provider',
            label: 'Provider',
            kind: 'select',
            description: 'Choose Meta Cloud API or relay-driven transport.',
            whereToGet: 'Use `meta` for direct Cloud API access, otherwise keep `relay`.',
            options: [
              { label: 'Relay', value: 'relay' },
              { label: 'Meta', value: 'meta' },
            ],
          },
          {
            key: 'access_token',
            label: 'Access token',
            kind: 'password',
            placeholder: 'EAAG...',
            description: 'Bearer token for Meta Cloud API requests.',
            whereToGet: 'Copy it from your Meta app / WhatsApp Cloud API setup.',
            docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/',
          },
          {
            key: 'phone_number_id',
            label: 'Phone number ID',
            kind: 'text',
            placeholder: '1234567890',
            description: 'Phone number id used for direct outbound sends.',
            whereToGet: 'Copy it from the WhatsApp Cloud API getting started dashboard.',
            docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/',
          },
          {
            key: 'business_account_id',
            label: 'Business account ID',
            kind: 'text',
            placeholder: '1234567890',
            description: 'Optional business account id for bookkeeping or API exploration.',
            whereToGet: 'Copy it from the Meta developer dashboard if available.',
            docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/',
          },
          {
            key: 'verify_token',
            label: 'Verify token',
            kind: 'password',
            placeholder: 'verify-token',
            description: 'Webhook verification token for inbound callback registration.',
            whereToGet: 'Choose and register it while configuring the webhook in Meta.',
            docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/',
          },
        ],
      },
      {
        id: 'transport',
        title: 'Transport',
        description: 'Meta API host/version, relay, and callback URL.',
        fields: [
          ...commonTransportFields,
          {
            key: 'api_base_url',
            label: 'API base URL',
            kind: 'url',
            placeholder: 'https://graph.facebook.com',
            description: 'Base URL for Meta Cloud API calls.',
            whereToGet: 'Normally keep the default Meta Graph host.',
            docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/',
          },
          {
            key: 'api_version',
            label: 'API version',
            kind: 'text',
            placeholder: 'v21.0',
            description: 'Meta Graph API version used for direct tests and sends.',
            whereToGet: 'Use the current Graph version required by your Meta app.',
            docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/',
          },
        ],
      },
      {
        id: 'access',
        title: 'Access control',
        description: 'Control direct and group delivery rules.',
        fields: commonAccessFields,
      },
    ],
  },
  {
    name: 'qq',
    label: 'QQ',
    subtitle: 'Official QQ bot workflow through the built-in gateway direct connection.',
    icon: RadioTower,
    portalLabel: 'Tencent QQ Bot Platform',
    portalUrl: 'https://bot.q.qq.com/',
    deliveryNote: 'Readiness checks exchange `access_token`, probe `/gateway`, and can actively send when you provide a user `openid` or group `group_openid`.',
    sections: [
      {
        id: 'identity',
        title: 'Bot credentials',
        description: 'Configure the Tencent app id, secret, and local bot alias.',
        fields: [
          {
            key: 'bot_name',
            label: 'Bot name',
            kind: 'text',
            placeholder: 'DeepScientist',
            description: 'Display name used by the QQ connector in DeepScientist.',
            whereToGet: 'Choose the alias shown in the workspace and connector cards.',
          },
          {
            key: 'app_id',
            label: 'App ID',
            kind: 'text',
            placeholder: 'qq-app-id',
            description: 'Tencent app id for the QQ bot.',
            whereToGet: 'Copy it from the QQ bot platform console.',
            docUrl: 'https://bot.q.qq.com/',
          },
          {
            key: 'app_secret',
            label: 'App secret',
            kind: 'password',
            placeholder: 'qq-app-secret',
            description: 'Used for QQ access token exchange and direct API delivery.',
            whereToGet: 'Copy it from the QQ bot platform console.',
            docUrl: 'https://cloud.tencent.com.cn/developer/article/2635190',
          },
          {
            key: 'main_chat_id',
            label: 'Detected OpenID',
            kind: 'text',
            readOnly: true,
            placeholder: 'openid-or-group_openid',
            description: 'This value is auto-filled after a QQ user sends the bot the first private message.',
            whereToGet: 'Step 1: save `app_id` + `app_secret`. Step 2: send one private QQ message to the bot. The system will detect and save the `openid` automatically.',
          },
        ],
      },
      {
        id: 'transport',
        title: 'Gateway transport',
        description: 'QQ only uses the built-in gateway direct connection in DeepScientist.',
        fields: [
          {
            key: 'require_at_in_groups',
            label: 'Require @ mention in groups',
            kind: 'boolean',
            description: 'Only process group messages when the bot is @mentioned.',
            whereToGet: 'Recommended for large QQ groups.',
          },
          {
            key: 'gateway_restart_on_config_change',
            label: 'Restart gateway on config change',
            kind: 'boolean',
            description: 'Restart the local QQ gateway worker after credentials or target settings change.',
            whereToGet: 'Keep this enabled so the daemon reconnects cleanly after QQ settings updates.',
          },
          {
            key: 'command_prefix',
            label: 'Command prefix',
            kind: 'text',
            placeholder: '/',
            description: 'Prefix used for `/use`, `/status`, `/approve`, and related commands.',
            whereToGet: 'Usually keep `/` so QQ matches the web and TUI command surface.',
          },
        ],
      },
      {
        id: 'access',
        title: 'Quest binding',
        description: 'QQ is often used for long-lived operator conversations, milestone push, and quest follow-up.',
        fields: [
          {
            key: 'auto_bind_dm_to_active_quest',
            label: 'Auto-bind DM to active quest',
            kind: 'boolean',
            description: 'If enabled, private QQ chats can automatically attach to the current active quest.',
            whereToGet: 'Enable when one operator usually drives the active quest from QQ.',
          },
        ],
      },
    ],
  },
]
