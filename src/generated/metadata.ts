export const NOTION_VERSION = "2026-03-11"

export const excluded = [
  {
    id: "upload-file",
    reason: "sends multipart/form-data, which the generated command cannot send",
  },
  {
    id: "create-a-token",
    reason: "OAuth: signs in with the connection's client secret and carries tokens; never a generated command",
  },
  {
    id: "revoke-token",
    reason: "OAuth: signs in with the connection's client secret and carries tokens; never a generated command",
  },
  {
    id: "introspect-token",
    reason: "OAuth: signs in with the connection's client secret and carries tokens; never a generated command",
  },
  {
    id: "upload-skill",
    reason: "sends multipart/form-data, which the generated command cannot send",
  },
]
