// GENERATED. DO NOT EDIT.
// Source: spec/notion/openapi.json, verified by provenance.json
// Run: pnpm generate

import { integer, number, unique } from "@wirecat/cli-base/codegen/runtime"
import * as v from "valibot"
import type * as T from "./types.js"

export const AgentIdParentForBlockBasedObjectResponse: v.GenericSchema<
  unknown,
  T.AgentIdParentForBlockBasedObjectResponse
> = v.looseObject({
  type: v.picklist(["agent_id"]),
  agent_id: v.lazy(() => IdResponse),
})

export const AnnotationRequest: v.GenericSchema<unknown, T.AnnotationRequest> = v.looseObject({
  bold: v.optional(v.boolean()),
  italic: v.optional(v.boolean()),
  strikethrough: v.optional(v.boolean()),
  underline: v.optional(v.boolean()),
  code: v.optional(v.boolean()),
  color: v.optional(v.lazy(() => ApiColor)),
})

export const AnnotationResponse: v.GenericSchema<unknown, T.AnnotationResponse> = v.looseObject({
  bold: v.boolean(),
  italic: v.boolean(),
  strikethrough: v.boolean(),
  underline: v.boolean(),
  code: v.boolean(),
  color: v.lazy(() => ApiColor),
})

export const ApiColor: v.GenericSchema<unknown, T.ApiColor> = v.picklist([
  "default",
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
  "default_background",
  "gray_background",
  "brown_background",
  "orange_background",
  "yellow_background",
  "green_background",
  "blue_background",
  "purple_background",
  "pink_background",
  "red_background",
])

export const ApiTranscriptionStatus: v.GenericSchema<unknown, T.ApiTranscriptionStatus> = v.picklist([
  "transcription_not_started",
  "transcription_paused",
  "transcription_in_progress",
  "transcription_failed",
  "summary_in_progress",
  "notes_ready",
])

export const ArrayBasedPropertyValueResponse: v.GenericSchema<unknown, T.ArrayBasedPropertyValueResponse> = v.union([
  v.lazy(() => TitleArrayBasedPropertyValueResponse),
  v.lazy(() => RichTextArrayBasedPropertyValueResponse),
  v.lazy(() => PeopleArrayBasedPropertyValueResponse),
  v.lazy(() => RelationArrayBasedPropertyValueResponse),
])

export const ArrayPartialRollupValueResponse: v.GenericSchema<unknown, T.ArrayPartialRollupValueResponse> =
  v.looseObject({
    type: v.picklist(["array"]),
    array: v.pipe(v.array(v.lazy(() => SimpleOrArrayPropertyValueResponse)), v.maxLength(100)),
  })

export const AsyncTaskMcpOperationName: v.GenericSchema<unknown, T.AsyncTaskMcpOperationName> = v.picklist([
  "create_pages",
  "update_page",
])

export const AsyncTaskRestOperationName: v.GenericSchema<unknown, T.AsyncTaskRestOperationName> = v.picklist([
  "POST /v1/pages",
  "PATCH /v1/pages/:page_id/markdown",
])

export const AudioBlockObjectResponse: v.GenericSchema<unknown, T.AudioBlockObjectResponse> = v.looseObject({
  type: v.picklist(["audio"]),
  audio: v.lazy(() => MediaContentWithFileAndCaptionResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const BaseWebhookPayload: v.GenericSchema<unknown, T.BaseWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
})

export const BlockIdCommentParentResponse: v.GenericSchema<unknown, T.BlockIdCommentParentResponse> = v.looseObject({
  type: v.picklist(["block_id"]),
  block_id: v.lazy(() => IdResponse),
})

export const BlockIdParentForBlockBasedObjectResponse: v.GenericSchema<
  unknown,
  T.BlockIdParentForBlockBasedObjectResponse
> = v.looseObject({
  type: v.picklist(["block_id"]),
  block_id: v.lazy(() => IdResponse),
})

export const BlockObjectRequest: v.GenericSchema<unknown, T.BlockObjectRequest> = v.union([
  v.looseObject({
    embed: v.union([v.lazy(() => MediaContentWithUrlAndCaptionRequest), v.lazy(() => EmbedFileUploadRequest)]),
    type: v.optional(v.picklist(["embed"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    bookmark: v.lazy(() => MediaContentWithUrlAndCaptionRequest),
    type: v.optional(v.picklist(["bookmark"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    image: v.lazy(() => MediaContentWithFileAndCaptionRequest),
    type: v.optional(v.picklist(["image"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    video: v.lazy(() => MediaContentWithFileAndCaptionRequest),
    type: v.optional(v.picklist(["video"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    pdf: v.lazy(() => MediaContentWithFileAndCaptionRequest),
    type: v.optional(v.picklist(["pdf"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    file: v.lazy(() => MediaContentWithFileNameAndCaptionRequest),
    type: v.optional(v.picklist(["file"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    audio: v.lazy(() => MediaContentWithFileAndCaptionRequest),
    type: v.optional(v.picklist(["audio"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    code: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      language: v.lazy(() => LanguageRequest),
      caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
    }),
    type: v.optional(v.picklist(["code"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    equation: v.lazy(() => ContentWithExpressionRequest),
    type: v.optional(v.picklist(["equation"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    divider: v.lazy(() => EmptyObject),
    type: v.optional(v.picklist(["divider"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    breadcrumb: v.lazy(() => EmptyObject),
    type: v.optional(v.picklist(["breadcrumb"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    tab: v.lazy(() => TabRequestWithNestedTabItemChildren),
    type: v.optional(v.picklist(["tab"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    table_of_contents: v.looseObject({
      color: v.optional(v.lazy(() => ApiColor)),
    }),
    type: v.optional(v.picklist(["table_of_contents"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    link_to_page: v.union([
      v.looseObject({
        page_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["page_id"])),
      }),
      v.looseObject({
        database_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["database_id"])),
      }),
      v.looseObject({
        comment_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["comment_id"])),
      }),
    ]),
    type: v.optional(v.picklist(["link_to_page"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    table_row: v.lazy(() => ContentWithTableRowRequest),
    type: v.optional(v.picklist(["table_row"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    table: v.lazy(() => TableRequestWithTableRowChildren),
    type: v.optional(v.picklist(["table"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    column_list: v.lazy(() => ColumnListRequest),
    type: v.optional(v.picklist(["column_list"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    column: v.lazy(() => ColumnWithChildrenRequest),
    type: v.optional(v.picklist(["column"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    heading_1: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      is_toggleable: v.optional(v.boolean()),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["heading_1"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    heading_2: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      is_toggleable: v.optional(v.boolean()),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["heading_2"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    heading_3: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      is_toggleable: v.optional(v.boolean()),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["heading_3"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    heading_4: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      is_toggleable: v.optional(v.boolean()),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["heading_4"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    paragraph: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      icon: v.optional(v.lazy(() => PageIconRequest)),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["paragraph"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    bulleted_list_item: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["bulleted_list_item"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    numbered_list_item: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["numbered_list_item"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    quote: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["quote"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    to_do: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
      checked: v.optional(v.boolean()),
    }),
    type: v.optional(v.picklist(["to_do"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    toggle: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["toggle"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    template: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["template"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    callout: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
      icon: v.optional(v.lazy(() => PageIconRequest)),
    }),
    type: v.optional(v.picklist(["callout"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    synced_block: v.looseObject({
      synced_from: v.nullable(
        v.looseObject({
          block_id: v.lazy(() => IdRequest),
          type: v.optional(v.picklist(["block_id"])),
        }),
      ),
      children: v.optional(
        v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
      ),
    }),
    type: v.optional(v.picklist(["synced_block"])),
    object: v.optional(v.picklist(["block"])),
  }),
])

export const BlockObjectRequestWithoutChildren: v.GenericSchema<unknown, T.BlockObjectRequestWithoutChildren> = v.union(
  [
    v.looseObject({
      embed: v.union([v.lazy(() => MediaContentWithUrlAndCaptionRequest), v.lazy(() => EmbedFileUploadRequest)]),
      type: v.optional(v.picklist(["embed"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      bookmark: v.lazy(() => MediaContentWithUrlAndCaptionRequest),
      type: v.optional(v.picklist(["bookmark"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      image: v.lazy(() => MediaContentWithFileAndCaptionRequest),
      type: v.optional(v.picklist(["image"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      video: v.lazy(() => MediaContentWithFileAndCaptionRequest),
      type: v.optional(v.picklist(["video"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      pdf: v.lazy(() => MediaContentWithFileAndCaptionRequest),
      type: v.optional(v.picklist(["pdf"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      file: v.lazy(() => MediaContentWithFileNameAndCaptionRequest),
      type: v.optional(v.picklist(["file"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      audio: v.lazy(() => MediaContentWithFileAndCaptionRequest),
      type: v.optional(v.picklist(["audio"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      code: v.looseObject({
        rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
        language: v.lazy(() => LanguageRequest),
        caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
      }),
      type: v.optional(v.picklist(["code"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      equation: v.lazy(() => ContentWithExpressionRequest),
      type: v.optional(v.picklist(["equation"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      divider: v.lazy(() => EmptyObject),
      type: v.optional(v.picklist(["divider"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      breadcrumb: v.lazy(() => EmptyObject),
      type: v.optional(v.picklist(["breadcrumb"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      tab: v.lazy(() => EmptyObject),
      type: v.optional(v.picklist(["tab"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      table_of_contents: v.looseObject({
        color: v.optional(v.lazy(() => ApiColor)),
      }),
      type: v.optional(v.picklist(["table_of_contents"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      link_to_page: v.union([
        v.looseObject({
          page_id: v.lazy(() => IdRequest),
          type: v.optional(v.picklist(["page_id"])),
        }),
        v.looseObject({
          database_id: v.lazy(() => IdRequest),
          type: v.optional(v.picklist(["database_id"])),
        }),
        v.looseObject({
          comment_id: v.lazy(() => IdRequest),
          type: v.optional(v.picklist(["comment_id"])),
        }),
      ]),
      type: v.optional(v.picklist(["link_to_page"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      table_row: v.lazy(() => ContentWithTableRowRequest),
      type: v.optional(v.picklist(["table_row"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      heading_1: v.lazy(() => HeaderContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["heading_1"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      heading_2: v.lazy(() => HeaderContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["heading_2"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      heading_3: v.lazy(() => HeaderContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["heading_3"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      heading_4: v.lazy(() => HeaderContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["heading_4"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      paragraph: v.lazy(() => ContentWithRichTextColorAndIconRequest),
      type: v.optional(v.picklist(["paragraph"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      bulleted_list_item: v.lazy(() => ContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["bulleted_list_item"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      numbered_list_item: v.lazy(() => ContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["numbered_list_item"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      quote: v.lazy(() => ContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["quote"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      to_do: v.looseObject({
        rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
        checked: v.optional(v.boolean()),
        color: v.optional(v.lazy(() => ApiColor)),
      }),
      type: v.optional(v.picklist(["to_do"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      toggle: v.lazy(() => ContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["toggle"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      template: v.lazy(() => ContentWithRichTextRequest),
      type: v.optional(v.picklist(["template"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      callout: v.looseObject({
        rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
        icon: v.optional(v.lazy(() => PageIconRequest)),
        color: v.optional(v.lazy(() => ApiColor)),
      }),
      type: v.optional(v.picklist(["callout"])),
      object: v.optional(v.picklist(["block"])),
    }),
    v.looseObject({
      synced_block: v.looseObject({
        synced_from: v.nullable(
          v.looseObject({
            block_id: v.lazy(() => IdRequest),
            type: v.optional(v.picklist(["block_id"])),
          }),
        ),
      }),
      type: v.optional(v.picklist(["synced_block"])),
      object: v.optional(v.picklist(["block"])),
    }),
  ],
)

export const BlockObjectResponse: v.GenericSchema<unknown, T.BlockObjectResponse> = v.union([
  v.lazy(() => ParagraphBlockObjectResponse),
  v.lazy(() => Heading1BlockObjectResponse),
  v.lazy(() => Heading2BlockObjectResponse),
  v.lazy(() => Heading3BlockObjectResponse),
  v.lazy(() => Heading4BlockObjectResponse),
  v.lazy(() => BulletedListItemBlockObjectResponse),
  v.lazy(() => NumberedListItemBlockObjectResponse),
  v.lazy(() => QuoteBlockObjectResponse),
  v.lazy(() => ToDoBlockObjectResponse),
  v.lazy(() => ToggleBlockObjectResponse),
  v.lazy(() => TemplateBlockObjectResponse),
  v.lazy(() => SyncedBlockBlockObjectResponse),
  v.lazy(() => ChildPageBlockObjectResponse),
  v.lazy(() => ChildDatabaseBlockObjectResponse),
  v.lazy(() => EquationBlockObjectResponse),
  v.lazy(() => CodeBlockObjectResponse),
  v.lazy(() => CalloutBlockObjectResponse),
  v.lazy(() => DividerBlockObjectResponse),
  v.lazy(() => BreadcrumbBlockObjectResponse),
  v.lazy(() => TableOfContentsBlockObjectResponse),
  v.lazy(() => TabBlockObjectResponse),
  v.lazy(() => ColumnListBlockObjectResponse),
  v.lazy(() => ColumnBlockObjectResponse),
  v.lazy(() => LinkToPageBlockObjectResponse),
  v.lazy(() => TableBlockObjectResponse),
  v.lazy(() => TableRowBlockObjectResponse),
  v.lazy(() => MeetingNotesBlockObjectResponse),
  v.lazy(() => EmbedBlockObjectResponse),
  v.lazy(() => BookmarkBlockObjectResponse),
  v.lazy(() => ImageBlockObjectResponse),
  v.lazy(() => VideoBlockObjectResponse),
  v.lazy(() => PdfBlockObjectResponse),
  v.lazy(() => FileBlockObjectResponse),
  v.lazy(() => AudioBlockObjectResponse),
  v.lazy(() => LinkPreviewBlockObjectResponse),
  v.lazy(() => UnsupportedBlockObjectResponse),
])

export const BlockObjectWithSingleLevelOfChildrenRequest: v.GenericSchema<
  unknown,
  T.BlockObjectWithSingleLevelOfChildrenRequest
> = v.union([
  v.looseObject({
    embed: v.union([v.lazy(() => MediaContentWithUrlAndCaptionRequest), v.lazy(() => EmbedFileUploadRequest)]),
    type: v.optional(v.picklist(["embed"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    bookmark: v.lazy(() => MediaContentWithUrlAndCaptionRequest),
    type: v.optional(v.picklist(["bookmark"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    image: v.lazy(() => MediaContentWithFileAndCaptionRequest),
    type: v.optional(v.picklist(["image"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    video: v.lazy(() => MediaContentWithFileAndCaptionRequest),
    type: v.optional(v.picklist(["video"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    pdf: v.lazy(() => MediaContentWithFileAndCaptionRequest),
    type: v.optional(v.picklist(["pdf"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    file: v.lazy(() => MediaContentWithFileNameAndCaptionRequest),
    type: v.optional(v.picklist(["file"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    audio: v.lazy(() => MediaContentWithFileAndCaptionRequest),
    type: v.optional(v.picklist(["audio"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    code: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      language: v.lazy(() => LanguageRequest),
      caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
    }),
    type: v.optional(v.picklist(["code"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    equation: v.lazy(() => ContentWithExpressionRequest),
    type: v.optional(v.picklist(["equation"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    divider: v.lazy(() => EmptyObject),
    type: v.optional(v.picklist(["divider"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    breadcrumb: v.lazy(() => EmptyObject),
    type: v.optional(v.picklist(["breadcrumb"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    tab: v.lazy(() => TabRequestWithTabItemChildren),
    type: v.optional(v.picklist(["tab"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    table_of_contents: v.looseObject({
      color: v.optional(v.lazy(() => ApiColor)),
    }),
    type: v.optional(v.picklist(["table_of_contents"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    link_to_page: v.union([
      v.looseObject({
        page_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["page_id"])),
      }),
      v.looseObject({
        database_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["database_id"])),
      }),
      v.looseObject({
        comment_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["comment_id"])),
      }),
    ]),
    type: v.optional(v.picklist(["link_to_page"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    table_row: v.lazy(() => ContentWithTableRowRequest),
    type: v.optional(v.picklist(["table_row"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    heading_1: v.lazy(() => HeaderContentWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["heading_1"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    heading_2: v.lazy(() => HeaderContentWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["heading_2"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    heading_3: v.lazy(() => HeaderContentWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["heading_3"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    heading_4: v.lazy(() => HeaderContentWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["heading_4"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    paragraph: v.lazy(() => ParagraphWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["paragraph"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    bulleted_list_item: v.lazy(() => ContentWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["bulleted_list_item"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    numbered_list_item: v.lazy(() => ContentWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["numbered_list_item"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    quote: v.lazy(() => ContentWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["quote"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    table: v.lazy(() => TableRequestWithTableRowChildren),
    type: v.optional(v.picklist(["table"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    to_do: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      children: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequestWithoutChildren)), v.maxLength(100))),
      checked: v.optional(v.boolean()),
    }),
    type: v.optional(v.picklist(["to_do"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    toggle: v.lazy(() => ContentWithSingleLevelOfChildrenRequest),
    type: v.optional(v.picklist(["toggle"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    template: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      children: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequestWithoutChildren)), v.maxLength(100))),
    }),
    type: v.optional(v.picklist(["template"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    callout: v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      color: v.optional(v.lazy(() => ApiColor)),
      children: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequestWithoutChildren)), v.maxLength(100))),
      icon: v.optional(v.lazy(() => PageIconRequest)),
    }),
    type: v.optional(v.picklist(["callout"])),
    object: v.optional(v.picklist(["block"])),
  }),
  v.looseObject({
    synced_block: v.looseObject({
      synced_from: v.nullable(
        v.looseObject({
          block_id: v.lazy(() => IdRequest),
          type: v.optional(v.picklist(["block_id"])),
        }),
      ),
      children: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequestWithoutChildren)), v.maxLength(100))),
    }),
    type: v.optional(v.picklist(["synced_block"])),
    object: v.optional(v.picklist(["block"])),
  }),
])

export const BoardViewConfigRequest: v.GenericSchema<unknown, T.BoardViewConfigRequest> = v.looseObject({
  type: v.picklist(["board"]),
  group_by: v.lazy(() => GroupByConfigRequest),
  sub_group_by: v.optional(v.nullable(v.union([v.lazy(() => GroupByConfigRequest)]))),
  properties: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewPropertyConfigRequest)), v.maxLength(100))])),
  ),
  cover: v.optional(v.nullable(v.union([v.lazy(() => CoverConfigRequest)]))),
  cover_size: v.optional(v.nullable(v.union([v.picklist(["small", "medium", "large"])]))),
  cover_aspect: v.optional(v.nullable(v.union([v.picklist(["contain", "cover"])]))),
  card_layout: v.optional(v.nullable(v.union([v.picklist(["list", "compact"])]))),
})

export const BoardViewConfigResponse: v.GenericSchema<unknown, T.BoardViewConfigResponse> = v.looseObject({
  type: v.picklist(["board"]),
  group_by: v.lazy(() => GroupByConfigResponse),
  sub_group_by: v.optional(v.lazy(() => GroupByConfigResponse)),
  properties: v.optional(v.pipe(v.array(v.lazy(() => ViewPropertyConfigResponse)), v.maxLength(100))),
  cover: v.optional(v.lazy(() => CoverConfigResponse)),
  cover_size: v.optional(v.picklist(["small", "medium", "large"])),
  cover_aspect: v.optional(v.picklist(["contain", "cover"])),
  card_layout: v.optional(v.picklist(["list", "compact"])),
})

export const BookmarkBlockObjectResponse: v.GenericSchema<unknown, T.BookmarkBlockObjectResponse> = v.looseObject({
  type: v.picklist(["bookmark"]),
  bookmark: v.lazy(() => MediaContentWithUrlAndCaptionResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const BooleanFormulaPropertyResponse: v.GenericSchema<unknown, T.BooleanFormulaPropertyResponse> = v.looseObject(
  {
    type: v.picklist(["boolean"]),
    boolean: v.nullable(v.boolean()),
  },
)

export const BooleanFormulaPropertyValueResponse: v.GenericSchema<unknown, T.BooleanFormulaPropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["boolean"]),
    boolean: v.nullable(v.union([v.boolean()])),
  })

export const BotInfoResponse: v.GenericSchema<unknown, T.BotInfoResponse> = v.looseObject({
  owner: v.union([
    v.looseObject({
      type: v.picklist(["user"]),
      user: v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          object: v.picklist(["user"]),
          name: v.nullable(v.union([v.string()])),
          avatar_url: v.nullable(v.union([v.string()])),
          type: v.picklist(["person"]),
          person: v.looseObject({
            email: v.optional(v.string()),
            email_verified: v.optional(v.boolean()),
          }),
        }),
        v.lazy(() => PartialUserObjectResponse),
      ]),
    }),
    v.looseObject({
      type: v.picklist(["workspace"]),
      workspace: v.literal(true),
    }),
  ]),
  workspace_id: v.string(),
  workspace_limits: v.looseObject({
    max_file_upload_size_in_bytes: integer({ minimum: 0 }),
  }),
  workspace_name: v.nullable(v.union([v.string()])),
})

export const BotUserObjectResponse: v.GenericSchema<unknown, T.BotUserObjectResponse> = v.looseObject({
  type: v.picklist(["bot"]),
  bot: v.union([v.lazy(() => EmptyObject), v.lazy(() => BotInfoResponse)]),
})

export const BreadcrumbBlockObjectResponse: v.GenericSchema<unknown, T.BreadcrumbBlockObjectResponse> = v.looseObject({
  type: v.picklist(["breadcrumb"]),
  breadcrumb: v.lazy(() => EmptyObject),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const BulletedListItemBlockObjectResponse: v.GenericSchema<unknown, T.BulletedListItemBlockObjectResponse> =
  v.looseObject({
    type: v.picklist(["bulleted_list_item"]),
    bulleted_list_item: v.lazy(() => ContentWithRichTextAndColorResponse),
    parent: v.lazy(() => ParentForBlockBasedObjectResponse),
    object: v.picklist(["block"]),
    id: v.string(),
    created_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_time: v.string(),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  })

export const ButtonPropertyConfigurationRequest: v.GenericSchema<unknown, T.ButtonPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["button"])),
    button: v.lazy(() => EmptyObject),
  })

export const ButtonPropertyItemObjectResponse: v.GenericSchema<unknown, T.ButtonPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["button"]),
    button: v.lazy(() => EmptyObject),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const ButtonSimplePropertyValueResponse: v.GenericSchema<unknown, T.ButtonSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["button"]),
    button: v.lazy(() => EmptyObject),
  })

export const CalendarViewConfigRequest: v.GenericSchema<unknown, T.CalendarViewConfigRequest> = v.looseObject({
  type: v.picklist(["calendar"]),
  date_property_id: v.string(),
  properties: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewPropertyConfigRequest)), v.maxLength(100))])),
  ),
  view_range: v.optional(v.nullable(v.union([v.picklist(["week", "month"])]))),
  show_weekends: v.optional(v.nullable(v.union([v.boolean()]))),
})

export const CalendarViewConfigResponse: v.GenericSchema<unknown, T.CalendarViewConfigResponse> = v.looseObject({
  type: v.picklist(["calendar"]),
  date_property_id: v.string(),
  date_property_name: v.optional(v.string()),
  properties: v.optional(v.pipe(v.array(v.lazy(() => ViewPropertyConfigResponse)), v.maxLength(100))),
  view_range: v.optional(v.picklist(["week", "month"])),
  show_weekends: v.optional(v.boolean()),
})

export const CalloutBlockObjectResponse: v.GenericSchema<unknown, T.CalloutBlockObjectResponse> = v.looseObject({
  type: v.picklist(["callout"]),
  callout: v.looseObject({
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
    color: v.lazy(() => ApiColor),
    icon: v.nullable(v.union([v.lazy(() => PageIconResponse)])),
  }),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const ChartAggregationRequest: v.GenericSchema<unknown, T.ChartAggregationRequest> = v.looseObject({
  aggregator: v.picklist([
    "count",
    "count_values",
    "sum",
    "average",
    "median",
    "min",
    "max",
    "range",
    "unique",
    "empty",
    "not_empty",
    "percent_empty",
    "percent_not_empty",
    "checked",
    "unchecked",
    "percent_checked",
    "percent_unchecked",
    "earliest_date",
    "latest_date",
    "date_range",
  ]),
  property_id: v.optional(v.string()),
})

export const ChartAggregationResponse: v.GenericSchema<unknown, T.ChartAggregationResponse> = v.looseObject({
  aggregator: v.picklist([
    "count",
    "count_values",
    "sum",
    "average",
    "median",
    "min",
    "max",
    "range",
    "unique",
    "empty",
    "not_empty",
    "percent_empty",
    "percent_not_empty",
    "checked",
    "unchecked",
    "percent_checked",
    "percent_unchecked",
    "earliest_date",
    "latest_date",
    "date_range",
  ]),
  property_id: v.optional(v.string()),
})

export const ChartReferenceLineRequest: v.GenericSchema<unknown, T.ChartReferenceLineRequest> = v.looseObject({
  value: number(),
  label: v.string(),
  color: v.picklist(["gray", "lightgray", "brown", "yellow", "orange", "green", "blue", "purple", "pink", "red"]),
  dash_style: v.picklist(["solid", "dash"]),
  id: v.optional(v.string()),
})

export const ChartReferenceLineResponse: v.GenericSchema<unknown, T.ChartReferenceLineResponse> = v.looseObject({
  id: v.string(),
  value: number(),
  label: v.string(),
  color: v.picklist(["gray", "lightgray", "brown", "yellow", "orange", "green", "blue", "purple", "pink", "red"]),
  dash_style: v.picklist(["solid", "dash"]),
})

export const ChartViewConfigRequest: v.GenericSchema<unknown, T.ChartViewConfigRequest> = v.looseObject({
  type: v.picklist(["chart"]),
  chart_type: v.picklist(["column", "bar", "line", "donut", "number"]),
  x_axis: v.optional(v.nullable(v.union([v.lazy(() => GroupByConfigRequest)]))),
  y_axis: v.optional(v.nullable(v.union([v.lazy(() => ChartAggregationRequest)]))),
  x_axis_property_id: v.optional(v.nullable(v.union([v.string()]))),
  y_axis_property_id: v.optional(v.nullable(v.union([v.string()]))),
  value: v.optional(v.nullable(v.union([v.lazy(() => ChartAggregationRequest)]))),
  sort: v.optional(
    v.nullable(v.union([v.picklist(["manual", "x_ascending", "x_descending", "y_ascending", "y_descending"])])),
  ),
  color_theme: v.optional(
    v.nullable(
      v.union([
        v.picklist(["gray", "blue", "yellow", "green", "purple", "teal", "orange", "pink", "red", "auto", "colorful"]),
      ]),
    ),
  ),
  height: v.optional(v.nullable(v.union([v.picklist(["small", "medium", "large", "extra_large"])]))),
  hide_empty_groups: v.optional(v.nullable(v.union([v.boolean()]))),
  legend_position: v.optional(v.nullable(v.union([v.picklist(["off", "bottom", "side"])]))),
  show_data_labels: v.optional(v.nullable(v.union([v.boolean()]))),
  axis_labels: v.optional(v.nullable(v.union([v.picklist(["none", "x_axis", "y_axis", "both"])]))),
  grid_lines: v.optional(v.nullable(v.union([v.picklist(["none", "horizontal", "vertical", "both"])]))),
  cumulative: v.optional(v.nullable(v.union([v.boolean()]))),
  smooth_line: v.optional(v.nullable(v.union([v.boolean()]))),
  hide_line_fill_area: v.optional(v.nullable(v.union([v.boolean()]))),
  group_style: v.optional(v.nullable(v.union([v.picklist(["normal", "percent", "side_by_side"])]))),
  y_axis_min: v.optional(v.nullable(v.union([number()]))),
  y_axis_max: v.optional(v.nullable(v.union([number()]))),
  donut_labels: v.optional(v.nullable(v.union([v.picklist(["none", "value", "name", "name_and_value"])]))),
  hide_title: v.optional(v.nullable(v.union([v.boolean()]))),
  stack_by: v.optional(v.nullable(v.union([v.lazy(() => GroupByConfigRequest)]))),
  reference_lines: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ChartReferenceLineRequest)), v.maxLength(100))])),
  ),
  caption: v.optional(v.nullable(v.union([v.string()]))),
  color_by_value: v.optional(v.nullable(v.union([v.boolean()]))),
})

export const ChartViewConfigResponse: v.GenericSchema<unknown, T.ChartViewConfigResponse> = v.looseObject({
  type: v.picklist(["chart"]),
  chart_type: v.picklist(["column", "bar", "line", "donut", "number"]),
  x_axis: v.optional(v.nullable(v.union([v.lazy(() => GroupByConfigResponse)]))),
  y_axis: v.optional(v.nullable(v.union([v.lazy(() => ChartAggregationResponse)]))),
  x_axis_property_id: v.optional(v.string()),
  y_axis_property_id: v.optional(v.string()),
  value: v.optional(v.lazy(() => ChartAggregationResponse)),
  sort: v.optional(v.picklist(["manual", "x_ascending", "x_descending", "y_ascending", "y_descending"])),
  color_theme: v.optional(
    v.picklist(["gray", "blue", "yellow", "green", "purple", "teal", "orange", "pink", "red", "auto", "colorful"]),
  ),
  height: v.optional(v.picklist(["small", "medium", "large", "extra_large"])),
  hide_empty_groups: v.optional(v.boolean()),
  legend_position: v.optional(v.picklist(["off", "bottom", "side"])),
  show_data_labels: v.optional(v.boolean()),
  axis_labels: v.optional(v.picklist(["none", "x_axis", "y_axis", "both"])),
  grid_lines: v.optional(v.picklist(["none", "horizontal", "vertical", "both"])),
  cumulative: v.optional(v.boolean()),
  smooth_line: v.optional(v.boolean()),
  hide_line_fill_area: v.optional(v.boolean()),
  group_style: v.optional(v.picklist(["normal", "percent", "side_by_side"])),
  y_axis_min: v.optional(v.nullable(v.union([number()]))),
  y_axis_max: v.optional(v.nullable(v.union([number()]))),
  donut_labels: v.optional(v.picklist(["none", "value", "name", "name_and_value"])),
  hide_title: v.optional(v.boolean()),
  stack_by: v.optional(v.nullable(v.union([v.lazy(() => GroupByConfigResponse)]))),
  reference_lines: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ChartReferenceLineResponse)), v.maxLength(100))])),
  ),
  caption: v.optional(v.nullable(v.union([v.string()]))),
  color_by_value: v.optional(v.boolean()),
})

export const CheckboxDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.CheckboxDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["checkbox"]),
  checkbox: v.lazy(() => EmptyObject),
})

export const CheckboxGroupByConfigRequest: v.GenericSchema<unknown, T.CheckboxGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["checkbox"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortRequest),
  hide_empty_groups: v.optional(v.boolean()),
})

export const CheckboxGroupByConfigResponse: v.GenericSchema<unknown, T.CheckboxGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["checkbox"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
})

export const CheckboxPropertyConfigurationRequest: v.GenericSchema<unknown, T.CheckboxPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["checkbox"])),
    checkbox: v.lazy(() => EmptyObject),
  })

export const CheckboxPropertyFilter: v.GenericSchema<unknown, T.CheckboxPropertyFilter> = v.union([
  v.looseObject({
    equals: v.boolean(),
  }),
  v.looseObject({
    does_not_equal: v.boolean(),
  }),
])

export const CheckboxPropertyItemObjectResponse: v.GenericSchema<unknown, T.CheckboxPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["checkbox"]),
    checkbox: v.boolean(),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const CheckboxSimplePropertyValueResponse: v.GenericSchema<unknown, T.CheckboxSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["checkbox"]),
    checkbox: v.boolean(),
  })

export const ChildDatabaseBlockObjectResponse: v.GenericSchema<unknown, T.ChildDatabaseBlockObjectResponse> =
  v.looseObject({
    type: v.picklist(["child_database"]),
    child_database: v.lazy(() => TitleObjectResponse),
    parent: v.lazy(() => ParentForBlockBasedObjectResponse),
    object: v.picklist(["block"]),
    id: v.string(),
    created_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_time: v.string(),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  })

export const ChildPageBlockObjectResponse: v.GenericSchema<unknown, T.ChildPageBlockObjectResponse> = v.looseObject({
  type: v.picklist(["child_page"]),
  child_page: v.lazy(() => TitleObjectResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const CodeBlockObjectResponse: v.GenericSchema<unknown, T.CodeBlockObjectResponse> = v.looseObject({
  type: v.picklist(["code"]),
  code: v.looseObject({
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
    caption: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
    language: v.lazy(() => LanguageRequest),
  }),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const ColumnBlockObjectResponse: v.GenericSchema<unknown, T.ColumnBlockObjectResponse> = v.looseObject({
  type: v.picklist(["column"]),
  column: v.lazy(() => ColumnResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const ColumnBlockWithChildrenRequest: v.GenericSchema<unknown, T.ColumnBlockWithChildrenRequest> = v.looseObject(
  {
    column: v.lazy(() => ColumnWithChildrenRequest),
    type: v.optional(v.picklist(["column"])),
    object: v.optional(v.picklist(["block"])),
  },
)

export const ColumnListBlockObjectResponse: v.GenericSchema<unknown, T.ColumnListBlockObjectResponse> = v.looseObject({
  type: v.picklist(["column_list"]),
  column_list: v.lazy(() => EmptyObject),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const ColumnListRequest: v.GenericSchema<unknown, T.ColumnListRequest> = v.looseObject({
  children: v.pipe(v.array(v.lazy(() => ColumnBlockWithChildrenRequest)), v.minLength(2), v.maxLength(100)),
})

export const ColumnResponse: v.GenericSchema<unknown, T.ColumnResponse> = v.looseObject({
  width_ratio: v.optional(number()),
})

export const ColumnWithChildrenRequest: v.GenericSchema<unknown, T.ColumnWithChildrenRequest> = v.looseObject({
  children: v.pipe(v.array(v.lazy(() => BlockObjectWithSingleLevelOfChildrenRequest)), v.maxLength(100)),
  width_ratio: v.optional(number()),
})

export const CommentCreatedWebhookPayload: v.GenericSchema<unknown, T.CommentCreatedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["comment.created"]),
  entity: v.lazy(() => WebhookCommentEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookExternalBlock),
    page_id: v.lazy(() => IdResponse),
    discussion_id: v.lazy(() => IdResponse),
    property_id: v.optional(v.string()),
  }),
})

export const CommentDeletedWebhookPayload: v.GenericSchema<unknown, T.CommentDeletedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["comment.deleted"]),
  entity: v.lazy(() => WebhookCommentEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookExternalBlock),
    page_id: v.lazy(() => IdResponse),
    discussion_id: v.lazy(() => IdResponse),
    property_id: v.optional(v.string()),
  }),
})

export const CommentObjectResponse: v.GenericSchema<unknown, T.CommentObjectResponse> = v.looseObject({
  object: v.picklist(["comment"]),
  id: v.lazy(() => IdResponse),
  parent: v.lazy(() => CommentParentResponse),
  discussion_id: v.lazy(() => IdResponse),
  created_time: v.string(),
  last_edited_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  display_name: v.looseObject({
    type: v.picklist(["custom", "user", "integration"]),
    resolved_name: v.nullable(v.union([v.string()])),
  }),
  original_content_deleted: v.boolean(),
  has_pending_attachments: v.boolean(),
  attachments: v.optional(
    v.pipe(
      v.array(
        v.looseObject({
          category: v.picklist(["audio", "image", "pdf", "productivity", "video"]),
          file: v.lazy(() => InternalFileResponse),
        }),
      ),
      v.maxLength(100),
    ),
  ),
  property_id: v.optional(v.string()),
})

export const CommentParentResponse: v.GenericSchema<unknown, T.CommentParentResponse> = v.union([
  v.lazy(() => PageIdCommentParentResponse),
  v.lazy(() => BlockIdCommentParentResponse),
])

export const CommentUpdatedWebhookPayload: v.GenericSchema<unknown, T.CommentUpdatedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["comment.updated"]),
  entity: v.lazy(() => WebhookCommentEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookExternalBlock),
    page_id: v.lazy(() => IdResponse),
    discussion_id: v.lazy(() => IdResponse),
    property_id: v.optional(v.string()),
  }),
})

export const ContentPositionSchema: v.GenericSchema<unknown, T.ContentPositionSchema> = v.union([
  v.looseObject({
    type: v.picklist(["after_block"]),
    after_block: v.looseObject({
      id: v.lazy(() => IdRequest),
    }),
  }),
  v.looseObject({
    type: v.picklist(["start"]),
  }),
  v.looseObject({
    type: v.picklist(["end"]),
  }),
])

export const ContentWithExpressionRequest: v.GenericSchema<unknown, T.ContentWithExpressionRequest> = v.looseObject({
  expression: v.string(),
})

export const ContentWithRichTextAndColorAndListResponse: v.GenericSchema<
  unknown,
  T.ContentWithRichTextAndColorAndListResponse
> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  color: v.lazy(() => ApiColor),
  list_start_index: v.optional(integer({ minimum: 1 })),
  list_format: v.optional(v.lazy(() => NumberedListFormat)),
})

export const ContentWithRichTextAndColorRequest: v.GenericSchema<unknown, T.ContentWithRichTextAndColorRequest> =
  v.looseObject({
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
    color: v.optional(v.lazy(() => ApiColor)),
  })

export const ContentWithRichTextAndColorResponse: v.GenericSchema<unknown, T.ContentWithRichTextAndColorResponse> =
  v.looseObject({
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
    color: v.lazy(() => ApiColor),
  })

export const ContentWithRichTextColorAndIconRequest: v.GenericSchema<
  unknown,
  T.ContentWithRichTextColorAndIconRequest
> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
  color: v.optional(v.lazy(() => ApiColor)),
  icon: v.optional(v.lazy(() => PageIconRequest)),
})

export const ContentWithRichTextColorAndIconResponse: v.GenericSchema<
  unknown,
  T.ContentWithRichTextColorAndIconResponse
> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  color: v.lazy(() => ApiColor),
  icon: v.nullable(v.union([v.lazy(() => PageIconResponse)])),
})

export const ContentWithRichTextColorAndIconUpdateRequest: v.GenericSchema<
  unknown,
  T.ContentWithRichTextColorAndIconUpdateRequest
> = v.looseObject({
  rich_text: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  icon: v.optional(v.lazy(() => PageIconRequest)),
  color: v.optional(v.lazy(() => ApiColor)),
})

export const ContentWithRichTextRequest: v.GenericSchema<unknown, T.ContentWithRichTextRequest> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
})

export const ContentWithSingleLevelOfChildrenRequest: v.GenericSchema<
  unknown,
  T.ContentWithSingleLevelOfChildrenRequest
> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
  color: v.optional(v.lazy(() => ApiColor)),
  children: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequestWithoutChildren)), v.maxLength(100))),
})

export const ContentWithTableResponse: v.GenericSchema<unknown, T.ContentWithTableResponse> = v.looseObject({
  has_column_header: v.boolean(),
  has_row_header: v.boolean(),
  table_width: integer({ minimum: 1 }),
})

export const ContentWithTableRowRequest: v.GenericSchema<unknown, T.ContentWithTableRowRequest> = v.looseObject({
  cells: v.pipe(v.array(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))), v.maxLength(100)),
})

export const ContentWithTableRowResponse: v.GenericSchema<unknown, T.ContentWithTableRowResponse> = v.looseObject({
  cells: v.pipe(v.array(v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100))), v.maxLength(100)),
})

export const CoverConfigRequest: v.GenericSchema<unknown, T.CoverConfigRequest> = v.looseObject({
  type: v.picklist(["page_cover", "page_content", "property"]),
  property_id: v.optional(v.string()),
})

export const CoverConfigResponse: v.GenericSchema<unknown, T.CoverConfigResponse> = v.looseObject({
  type: v.picklist(["page_cover", "page_content", "page_content_first", "property"]),
  property_id: v.optional(v.string()),
})

export const CreateDatabaseForViewRequest: v.GenericSchema<unknown, T.CreateDatabaseForViewRequest> = v.looseObject({
  parent: v.looseObject({
    type: v.picklist(["page_id"]),
    page_id: v.lazy(() => IdRequest),
  }),
  position: v.optional(
    v.looseObject({
      type: v.picklist(["after_block"]),
      block_id: v.lazy(() => IdRequest),
    }),
  ),
  show_data_source_title: v.optional(v.boolean()),
})

export const CreateViewQueryRequest: v.GenericSchema<unknown, T.CreateViewQueryRequest> = v.looseObject({
  page_size: v.optional(integer({ minimum: 1, maximum: 100 })),
})

export const CreateViewRequest: v.GenericSchema<unknown, T.CreateViewRequest> = v.looseObject({
  data_source_id: v.lazy(() => IdRequest),
  name: v.string(),
  type: v.lazy(() => ViewTypeRequest),
  database_id: v.optional(v.lazy(() => IdRequest)),
  view_id: v.optional(v.lazy(() => IdRequest)),
  filter: v.optional(v.lazy(() => ViewFilterRequest)),
  sorts: v.optional(v.lazy(() => ViewSortsRequest)),
  quick_filters: v.optional(
    v.record(
      v.string(),
      v.lazy(() => QuickFilterConditionRequest),
    ),
  ),
  create_database: v.optional(v.lazy(() => CreateDatabaseForViewRequest)),
  configuration: v.optional(v.lazy(() => ViewConfigRequest)),
  position: v.optional(v.lazy(() => ViewPositionRequest)),
  placement: v.optional(v.lazy(() => WidgetPlacementRequest)),
})

export const CreatedByDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.CreatedByDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["created_by"]),
  created_by: v.lazy(() => EmptyObject),
})

export const CreatedByPropertyConfigurationRequest: v.GenericSchema<unknown, T.CreatedByPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["created_by"])),
    created_by: v.lazy(() => EmptyObject),
  })

export const CreatedByPropertyItemObjectResponse: v.GenericSchema<unknown, T.CreatedByPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["created_by"]),
    created_by: v.union([v.lazy(() => PartialUserObjectResponse), v.lazy(() => UserObjectResponse)]),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const CreatedBySimplePropertyValueResponse: v.GenericSchema<unknown, T.CreatedBySimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["created_by"]),
    created_by: v.lazy(() => UserValueResponse),
  })

export const CreatedTimeDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.CreatedTimeDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["created_time"]),
  created_time: v.lazy(() => EmptyObject),
})

export const CreatedTimePropertyConfigurationRequest: v.GenericSchema<
  unknown,
  T.CreatedTimePropertyConfigurationRequest
> = v.looseObject({
  type: v.optional(v.picklist(["created_time"])),
  created_time: v.lazy(() => EmptyObject),
})

export const CreatedTimePropertyItemObjectResponse: v.GenericSchema<unknown, T.CreatedTimePropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["created_time"]),
    created_time: v.string(),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const CreatedTimeSimplePropertyValueResponse: v.GenericSchema<
  unknown,
  T.CreatedTimeSimplePropertyValueResponse
> = v.looseObject({
  type: v.picklist(["created_time"]),
  created_time: v.string(),
})

export const CustomEmojiPageIconRequest: v.GenericSchema<unknown, T.CustomEmojiPageIconRequest> = v.looseObject({
  type: v.optional(v.picklist(["custom_emoji"])),
  custom_emoji: v.looseObject({
    id: v.lazy(() => IdRequest),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
  }),
})

export const CustomEmojiPageIconResponse: v.GenericSchema<unknown, T.CustomEmojiPageIconResponse> = v.looseObject({
  type: v.picklist(["custom_emoji"]),
  custom_emoji: v.lazy(() => CustomEmojiResponse),
})

export const CustomEmojiResponse: v.GenericSchema<unknown, T.CustomEmojiResponse> = v.looseObject({
  id: v.lazy(() => IdResponse),
  name: v.string(),
  url: v.string(),
})

export const DashboardRowResponse: v.GenericSchema<unknown, T.DashboardRowResponse> = v.looseObject({
  id: v.string(),
  widgets: v.pipe(v.array(v.lazy(() => DashboardWidgetResponse)), v.maxLength(100)),
  height: v.optional(integer()),
})

export const DashboardViewConfigResponse: v.GenericSchema<unknown, T.DashboardViewConfigResponse> = v.looseObject({
  type: v.picklist(["dashboard"]),
  rows: v.pipe(v.array(v.lazy(() => DashboardRowResponse)), v.maxLength(100)),
})

export const DashboardWidgetResponse: v.GenericSchema<unknown, T.DashboardWidgetResponse> = v.looseObject({
  id: v.string(),
  view_id: v.string(),
  width: v.optional(integer()),
  row_index: v.optional(integer()),
})

export const DataSourceContentUpdatedWebhookPayload: v.GenericSchema<
  unknown,
  T.DataSourceContentUpdatedWebhookPayload
> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["data_source.content_updated"]),
  entity: v.lazy(() => WebhookDatabaseEventEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
    updated_blocks: v.pipe(v.array(v.lazy(() => WebhookUpdatedBlock)), v.maxLength(100)),
  }),
})

export const DataSourceCreatedWebhookPayload: v.GenericSchema<unknown, T.DataSourceCreatedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["data_source.created"]),
    entity: v.lazy(() => WebhookDatabaseEventEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
    }),
  })

export const DataSourceDeletedWebhookPayload: v.GenericSchema<unknown, T.DataSourceDeletedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["data_source.deleted"]),
    entity: v.lazy(() => WebhookDatabaseEventEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
    }),
  })

export const DataSourceMovedWebhookPayload: v.GenericSchema<unknown, T.DataSourceMovedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["data_source.moved"]),
  entity: v.lazy(() => WebhookDatabaseEventEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const DataSourceObjectResponse: v.GenericSchema<unknown, T.DataSourceObjectResponse> = v.looseObject({
  object: v.picklist(["data_source"]),
  id: v.lazy(() => IdResponse),
  title: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  description: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  parent: v.lazy(() => ParentOfDataSourceResponse),
  database_parent: v.lazy(() => ParentOfDatabaseResponse),
  is_inline: v.boolean(),
  database_type: v.nullable(
    v.union([
      v.picklist(["tasks", "projects", "sprints", "docs", "wiki", "meetings", "meeting_notes", "skills", "github_prs"]),
    ]),
  ),
  in_trash: v.boolean(),
  created_time: v.string(),
  last_edited_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  properties: v.record(
    v.string(),
    v.lazy(() => DatabasePropertyConfigResponse),
  ),
  icon: v.nullable(v.union([v.lazy(() => PageIconResponse)])),
  cover: v.nullable(v.union([v.lazy(() => PageCoverResponse)])),
  url: v.string(),
  public_url: v.nullable(v.union([v.string()])),
  sync_metadata: v.optional(
    v.looseObject({
      health: v.optional(
        v.nullable(
          v.union([
            v.looseObject({
              checks: v.looseObject({
                sync_version_updated_at: v.string(),
                delta_synced_through_at: v.optional(v.string()),
                last_execution_succeeded_at: v.optional(v.string()),
              }),
              error: v.looseObject({
                code: v.string(),
                severity: v.picklist(["action_required", "degraded", "failing"]),
              }),
              ok: v.literal(false),
              paused: v.boolean(),
              stage: v.picklist(["backfilling", "initializing", "steady"]),
            }),
            v.looseObject({
              checks: v.looseObject({
                sync_version_updated_at: v.string(),
                delta_synced_through_at: v.optional(v.string()),
                last_execution_succeeded_at: v.optional(v.string()),
              }),
              ok: v.literal(true),
              paused: v.boolean(),
              stage: v.picklist(["backfilling", "initializing", "steady"]),
            }),
            v.looseObject({
              paused: v.literal(true),
            }),
          ]),
        ),
      ),
      owner_user_id: v.optional(v.lazy(() => IdResponse)),
      resource: v.optional(v.string()),
      external_database_sync: v.optional(
        v.looseObject({
          sync_id: v.lazy(() => IdResponse),
          provider: v.picklist(["github", "jira", "salesforce"]),
        }),
      ),
      external_collection_type: v.optional(v.picklist(["Jira", "Salesforce"])),
      sync_id: v.optional(v.lazy(() => IdResponse)),
      sync_state: v.optional(
        v.looseObject({
          syncing: v.union([v.boolean(), v.picklist(["row_limit_exceeded"])]),
          last_synced_at: v.optional(v.string()),
          last_sync_checkpoint_at: v.optional(v.string()),
          last_sync_heartbeat_at: v.optional(v.string()),
        }),
      ),
      synced_collection_key: v.optional(v.string()),
    }),
  ),
})

export const DataSourceParentResponse: v.GenericSchema<unknown, T.DataSourceParentResponse> = v.looseObject({
  type: v.picklist(["data_source_id"]),
  data_source_id: v.lazy(() => IdResponse),
  database_id: v.lazy(() => IdResponse),
})

export const DataSourceReferenceResponse: v.GenericSchema<unknown, T.DataSourceReferenceResponse> = v.looseObject({
  id: v.lazy(() => IdResponse),
  name: v.string(),
  sync_metadata: v.optional(
    v.looseObject({
      health: v.optional(
        v.nullable(
          v.union([
            v.looseObject({
              checks: v.looseObject({
                sync_version_updated_at: v.string(),
                delta_synced_through_at: v.optional(v.string()),
                last_execution_succeeded_at: v.optional(v.string()),
              }),
              error: v.looseObject({
                code: v.string(),
                severity: v.picklist(["action_required", "degraded", "failing"]),
              }),
              ok: v.literal(false),
              paused: v.boolean(),
              stage: v.picklist(["backfilling", "initializing", "steady"]),
            }),
            v.looseObject({
              checks: v.looseObject({
                sync_version_updated_at: v.string(),
                delta_synced_through_at: v.optional(v.string()),
                last_execution_succeeded_at: v.optional(v.string()),
              }),
              ok: v.literal(true),
              paused: v.boolean(),
              stage: v.picklist(["backfilling", "initializing", "steady"]),
            }),
            v.looseObject({
              paused: v.literal(true),
            }),
          ]),
        ),
      ),
      owner_user_id: v.optional(v.lazy(() => IdResponse)),
      resource: v.optional(v.string()),
      external_database_sync: v.optional(
        v.looseObject({
          sync_id: v.lazy(() => IdResponse),
          provider: v.picklist(["github", "jira", "salesforce"]),
        }),
      ),
      external_collection_type: v.optional(v.picklist(["Jira", "Salesforce"])),
      sync_id: v.optional(v.lazy(() => IdResponse)),
      sync_state: v.optional(
        v.looseObject({
          syncing: v.union([v.boolean(), v.picklist(["row_limit_exceeded"])]),
          last_synced_at: v.optional(v.string()),
          last_sync_checkpoint_at: v.optional(v.string()),
          last_sync_heartbeat_at: v.optional(v.string()),
        }),
      ),
      synced_collection_key: v.optional(v.string()),
    }),
  ),
})

export const DataSourceSchemaUpdatedWebhookPayload: v.GenericSchema<unknown, T.DataSourceSchemaUpdatedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["data_source.schema_updated"]),
    entity: v.lazy(() => WebhookDatabaseEventEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
      updated_properties: v.optional(
        v.pipe(
          v.array(
            v.looseObject({
              id: v.string(),
              name: v.nullable(v.union([v.string()])),
              action: v.picklist(["created", "updated", "deleted"]),
            }),
          ),
          v.maxLength(100),
        ),
      ),
    }),
  })

export const DataSourceUndeletedWebhookPayload: v.GenericSchema<unknown, T.DataSourceUndeletedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["data_source.undeleted"]),
    entity: v.lazy(() => WebhookDatabaseEventEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
    }),
  })

export const DataSourceViewObjectResponse: v.GenericSchema<unknown, T.DataSourceViewObjectResponse> = v.looseObject({
  object: v.picklist(["view"]),
  id: v.lazy(() => IdResponse),
  parent: v.lazy(() => DatabaseParentResponse),
  name: v.string(),
  type: v.picklist(["table", "board", "list", "calendar", "timeline", "gallery", "form", "chart", "map", "dashboard"]),
  created_time: v.string(),
  last_edited_time: v.string(),
  url: v.string(),
  data_source_id: v.optional(v.nullable(v.union([v.string()]))),
  created_by: v.optional(v.nullable(v.union([v.lazy(() => PartialUserObjectResponse)]))),
  last_edited_by: v.optional(v.nullable(v.union([v.lazy(() => PartialUserObjectResponse)]))),
  filter: v.optional(v.nullable(v.union([v.lazy(() => ViewFilterResponse)]))),
  sorts: v.optional(v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewSortResponse)), v.maxLength(100))]))),
  quick_filters: v.optional(
    v.nullable(
      v.union([
        v.record(
          v.string(),
          v.lazy(() => QuickFilterConditionResponse),
        ),
      ]),
    ),
  ),
  configuration: v.optional(v.nullable(v.union([v.lazy(() => ViewConfigResponse)]))),
  dashboard_view_id: v.optional(v.string()),
})

export const DataSourceViewReferenceResponse: v.GenericSchema<unknown, T.DataSourceViewReferenceResponse> =
  v.looseObject({
    object: v.picklist(["view"]),
    id: v.lazy(() => IdResponse),
  })

export const DatabaseContentUpdatedWebhookPayload: v.GenericSchema<unknown, T.DatabaseContentUpdatedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["database.content_updated"]),
    entity: v.lazy(() => WebhookDatabaseEventEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
      updated_blocks: v.pipe(v.array(v.lazy(() => WebhookUpdatedBlock)), v.maxLength(100)),
    }),
  })

export const DatabaseCreatedWebhookPayload: v.GenericSchema<unknown, T.DatabaseCreatedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["database.created"]),
  entity: v.lazy(() => WebhookDatabaseEventEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const DatabaseDeletedWebhookPayload: v.GenericSchema<unknown, T.DatabaseDeletedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["database.deleted"]),
  entity: v.lazy(() => WebhookDatabaseEventEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const DatabaseMovedWebhookPayload: v.GenericSchema<unknown, T.DatabaseMovedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["database.moved"]),
  entity: v.lazy(() => WebhookDatabaseEventEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const DatabaseObjectResponse: v.GenericSchema<unknown, T.DatabaseObjectResponse> = v.looseObject({
  object: v.picklist(["database"]),
  id: v.lazy(() => IdResponse),
  title: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  description: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  parent: v.lazy(() => ParentOfDatabaseResponse),
  is_inline: v.boolean(),
  database_type: v.nullable(
    v.union([
      v.picklist(["tasks", "projects", "sprints", "docs", "wiki", "meetings", "meeting_notes", "skills", "github_prs"]),
    ]),
  ),
  in_trash: v.boolean(),
  is_locked: v.boolean(),
  show_data_source_title: v.boolean(),
  created_time: v.string(),
  last_edited_time: v.string(),
  data_sources: v.pipe(v.array(v.lazy(() => DataSourceReferenceResponse)), v.maxLength(100)),
  icon: v.nullable(v.union([v.lazy(() => PageIconResponse)])),
  cover: v.nullable(v.union([v.lazy(() => PageCoverResponse)])),
  url: v.string(),
  public_url: v.nullable(v.union([v.string()])),
})

export const DatabaseParentResponse: v.GenericSchema<unknown, T.DatabaseParentResponse> = v.looseObject({
  type: v.picklist(["database_id"]),
  database_id: v.lazy(() => IdResponse),
})

export const DatabasePropertyConfigResponse: v.GenericSchema<unknown, T.DatabasePropertyConfigResponse> = v.union([
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["number"]),
    number: v.looseObject({
      format: v.lazy(() => NumberFormat),
    }),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["formula"]),
    formula: v.looseObject({
      expression: v.string(),
    }),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["select"]),
    select: v.looseObject({
      options: v.pipe(v.array(v.lazy(() => SelectPropertyResponse)), v.maxLength(100)),
    }),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["multi_select"]),
    multi_select: v.looseObject({
      options: v.pipe(v.array(v.lazy(() => SelectPropertyResponse)), v.maxLength(100)),
    }),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["status"]),
    status: v.looseObject({
      default_option: v.nullable(v.union([v.string()])),
      options: v.pipe(v.array(v.lazy(() => StatusPropertyResponse)), v.maxLength(100)),
      groups: v.pipe(
        v.array(
          v.looseObject({
            id: v.string(),
            name: v.string(),
            color: v.lazy(() => SelectColor),
            option_ids: v.pipe(v.array(v.string()), v.maxLength(100)),
          }),
        ),
        v.maxLength(100),
      ),
    }),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["relation"]),
    relation: v.lazy(() => DatabasePropertyRelationConfigResponse),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["rollup"]),
    rollup: v.looseObject({
      function: v.lazy(() => RollupFunction),
      rollup_property_name: v.string(),
      relation_property_name: v.string(),
      rollup_property_id: v.string(),
      relation_property_id: v.string(),
    }),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["unique_id"]),
    unique_id: v.looseObject({
      prefix: v.nullable(v.union([v.string()])),
    }),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["title"]),
    title: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["rich_text"]),
    rich_text: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["url"]),
    url: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["people"]),
    people: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["files"]),
    files: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["email"]),
    email: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["phone_number"]),
    phone_number: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["date"]),
    date: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["checkbox"]),
    checkbox: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["created_by"]),
    created_by: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["created_time"]),
    created_time: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["last_edited_by"]),
    last_edited_by: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
    type: v.picklist(["last_edited_time"]),
    last_edited_time: v.lazy(() => EmptyObject),
  }),
])

export const DatabasePropertyConfigResponseCommon: v.GenericSchema<unknown, T.DatabasePropertyConfigResponseCommon> =
  v.looseObject({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)])),
  })

export const DatabasePropertyRelationConfigResponse: v.GenericSchema<
  unknown,
  T.DatabasePropertyRelationConfigResponse
> = v.union([
  v.looseObject({
    database_id: v.lazy(() => IdResponse),
    data_source_id: v.lazy(() => IdResponse),
    limit: v.nullable(v.union([integer({ minimum: 1 })])),
    type: v.picklist(["single_property"]),
    single_property: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    database_id: v.lazy(() => IdResponse),
    data_source_id: v.lazy(() => IdResponse),
    limit: v.nullable(v.union([integer({ minimum: 1 })])),
    type: v.optional(v.picklist(["dual_property"])),
    dual_property: v.looseObject({
      synced_property_id: v.string(),
      synced_property_name: v.string(),
    }),
  }),
])

export const DatabasePropertyRelationConfigResponseCommon: v.GenericSchema<
  unknown,
  T.DatabasePropertyRelationConfigResponseCommon
> = v.looseObject({
  database_id: v.lazy(() => IdResponse),
  data_source_id: v.lazy(() => IdResponse),
  limit: v.nullable(v.union([integer({ minimum: 1 })])),
})

export const DatabaseSchemaUpdatedWebhookPayload: v.GenericSchema<unknown, T.DatabaseSchemaUpdatedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["database.schema_updated"]),
    entity: v.lazy(() => WebhookDatabaseEventEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
      updated_properties: v.optional(
        v.pipe(
          v.array(
            v.looseObject({
              id: v.string(),
              name: v.nullable(v.union([v.string()])),
              action: v.picklist(["created", "updated", "deleted"]),
            }),
          ),
          v.maxLength(100),
        ),
      ),
    }),
  })

export const DatabaseUndeletedWebhookPayload: v.GenericSchema<unknown, T.DatabaseUndeletedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["database.undeleted"]),
    entity: v.lazy(() => WebhookDatabaseEventEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
    }),
  })

export const DateDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.DateDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["date"]),
    date: v.lazy(() => EmptyObject),
  })

export const DateFormulaPropertyResponse: v.GenericSchema<unknown, T.DateFormulaPropertyResponse> = v.looseObject({
  type: v.picklist(["date"]),
  date: v.nullable(v.union([v.lazy(() => DateResponse)])),
})

export const DateFormulaPropertyValueResponse: v.GenericSchema<unknown, T.DateFormulaPropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["date"]),
    date: v.nullable(v.union([v.lazy(() => DateResponse)])),
  })

export const DateGroupByConfigRequest: v.GenericSchema<unknown, T.DateGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["date", "created_time", "last_edited_time"]),
  property_id: v.string(),
  group_by: v.picklist(["relative", "day", "week", "month", "year"]),
  sort: v.lazy(() => GroupSortRequest),
  hide_empty_groups: v.optional(v.boolean()),
  start_day_of_week: v.optional(number()),
})

export const DateGroupByConfigResponse: v.GenericSchema<unknown, T.DateGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["date", "created_time", "last_edited_time"]),
  property_id: v.string(),
  group_by: v.picklist(["relative", "day", "week", "month", "year"]),
  sort: v.lazy(() => GroupSortResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
  start_day_of_week: v.optional(number()),
})

export const DateOrRelativeDate: v.GenericSchema<unknown, T.DateOrRelativeDate> = v.union([
  v.string(),
  v.lazy(() => RelativeDateValue),
])

export const DatePartialRollupValueResponse: v.GenericSchema<unknown, T.DatePartialRollupValueResponse> = v.looseObject(
  {
    type: v.picklist(["date"]),
    date: v.nullable(v.union([v.lazy(() => DateResponse)])),
  },
)

export const DatePropertyConfigurationRequest: v.GenericSchema<unknown, T.DatePropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["date"])),
    date: v.lazy(() => EmptyObject),
  })

export const DatePropertyFilter: v.GenericSchema<unknown, T.DatePropertyFilter> = v.union([
  v.union([
    v.looseObject({
      equals: v.lazy(() => DateOrRelativeDate),
    }),
    v.looseObject({
      before: v.lazy(() => DateOrRelativeDate),
    }),
    v.looseObject({
      after: v.lazy(() => DateOrRelativeDate),
    }),
    v.looseObject({
      on_or_before: v.lazy(() => DateOrRelativeDate),
    }),
    v.looseObject({
      on_or_after: v.lazy(() => DateOrRelativeDate),
    }),
    v.looseObject({
      this_week: v.lazy(() => EmptyObject),
    }),
    v.looseObject({
      past_week: v.lazy(() => EmptyObject),
    }),
    v.looseObject({
      past_month: v.lazy(() => EmptyObject),
    }),
    v.looseObject({
      past_year: v.lazy(() => EmptyObject),
    }),
    v.looseObject({
      next_week: v.lazy(() => EmptyObject),
    }),
    v.looseObject({
      next_month: v.lazy(() => EmptyObject),
    }),
    v.looseObject({
      next_year: v.lazy(() => EmptyObject),
    }),
  ]),
  v.lazy(() => ExistencePropertyFilter),
])

export const DatePropertyItemObjectResponse: v.GenericSchema<unknown, T.DatePropertyItemObjectResponse> = v.looseObject(
  {
    type: v.picklist(["date"]),
    date: v.nullable(v.union([v.lazy(() => DateResponse)])),
    object: v.picklist(["property_item"]),
    id: v.string(),
  },
)

export const DateRequest: v.GenericSchema<unknown, T.DateRequest> = v.looseObject({
  start: v.string(),
  end: v.optional(v.nullable(v.union([v.string()]))),
  time_zone: v.optional(v.nullable(v.union([v.lazy(() => TimeZoneRequest)]))),
})

export const DateResponse: v.GenericSchema<unknown, T.DateResponse> = v.looseObject({
  start: v.string(),
  end: v.nullable(v.union([v.string()])),
  time_zone: v.nullable(v.union([v.lazy(() => TimeZoneRequest)])),
})

export const DateSimplePropertyValueResponse: v.GenericSchema<unknown, T.DateSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["date"]),
    date: v.nullable(v.union([v.lazy(() => DateResponse)])),
  })

export const DeletedViewQueryResponse: v.GenericSchema<unknown, T.DeletedViewQueryResponse> = v.looseObject({
  object: v.picklist(["view_query"]),
  id: v.lazy(() => IdResponse),
  deleted: v.boolean(),
})

export const DividerBlockObjectResponse: v.GenericSchema<unknown, T.DividerBlockObjectResponse> = v.looseObject({
  type: v.picklist(["divider"]),
  divider: v.lazy(() => EmptyObject),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const DualPropertyDatabasePropertyRelationConfigResponse: v.GenericSchema<
  unknown,
  T.DualPropertyDatabasePropertyRelationConfigResponse
> = v.looseObject({
  type: v.optional(v.picklist(["dual_property"])),
  dual_property: v.looseObject({
    synced_property_id: v.string(),
    synced_property_name: v.string(),
  }),
})

export const EmailDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.EmailDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["email"]),
    email: v.lazy(() => EmptyObject),
  })

export const EmailPropertyConfigurationRequest: v.GenericSchema<unknown, T.EmailPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["email"])),
    email: v.lazy(() => EmptyObject),
  })

export const EmailPropertyItemObjectResponse: v.GenericSchema<unknown, T.EmailPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["email"]),
    email: v.nullable(v.string()),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const EmailSimplePropertyValueResponse: v.GenericSchema<unknown, T.EmailSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["email"]),
    email: v.nullable(v.union([v.string()])),
  })

export const EmbedBlockObjectResponse: v.GenericSchema<unknown, T.EmbedBlockObjectResponse> = v.looseObject({
  type: v.picklist(["embed"]),
  embed: v.lazy(() => MediaContentWithUrlAndCaptionResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const EmbedFileUploadRequest: v.GenericSchema<unknown, T.EmbedFileUploadRequest> = v.looseObject({
  file_upload: v.lazy(() => FileUploadIdRequest),
  type: v.optional(v.picklist(["file_upload"])),
  caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
})

export const EmojiPageIconRequest: v.GenericSchema<unknown, T.EmojiPageIconRequest> = v.looseObject({
  type: v.optional(v.picklist(["emoji"])),
  emoji: v.lazy(() => EmojiRequest),
})

export const EmojiPageIconResponse: v.GenericSchema<unknown, T.EmojiPageIconResponse> = v.looseObject({
  type: v.picklist(["emoji"]),
  emoji: v.lazy(() => EmojiRequest),
})

export const EmojiRequest: v.GenericSchema<unknown, T.EmojiRequest> = v.string()

export const EmptyObject: v.GenericSchema<unknown, T.EmptyObject> = v.looseObject({})

export const EquationBlockObjectResponse: v.GenericSchema<unknown, T.EquationBlockObjectResponse> = v.looseObject({
  type: v.picklist(["equation"]),
  equation: v.lazy(() => ExpressionObjectResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const EquationRichTextItemRequest: v.GenericSchema<unknown, T.EquationRichTextItemRequest> = v.looseObject({
  type: v.optional(v.picklist(["equation"])),
  equation: v.looseObject({
    expression: v.string(),
  }),
})

export const EquationRichTextItemResponse: v.GenericSchema<unknown, T.EquationRichTextItemResponse> = v.looseObject({
  type: v.picklist(["equation"]),
  equation: v.looseObject({
    expression: v.string(),
  }),
})

export const ErrorApi400: v.GenericSchema<unknown, T.ErrorApi400> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist([
    "invalid_json",
    "invalid_request_url",
    "invalid_request",
    "missing_version",
    "invalid_beta",
    "validation_error",
    "invalid_credit_limit",
  ]),
  status: v.pipe(integer(), v.picklist([400])),
})

export const ErrorApi401: v.GenericSchema<unknown, T.ErrorApi401> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["unauthorized"]),
  status: v.pipe(integer(), v.picklist([401])),
})

export const ErrorApi403: v.GenericSchema<unknown, T.ErrorApi403> = v.union([
  v.looseObject({
    object: v.picklist(["error"]),
    message: v.string(),
    additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
    code: v.picklist(["restricted_resource", "status_change_not_allowed"]),
    status: v.pipe(integer(), v.picklist([403])),
  }),
  v.looseObject({
    object: v.picklist(["error"]),
    message: v.string(),
    additional_data: v.objectWithRest(
      {
        tool_error_code: v.picklist(["workspace_credits_exhausted"]),
        tool_error_class: v.picklist(["entitlement_required"]),
        tool_error_retryable: v.picklist(["false"]),
        recovery_kind: v.picklist(["contact_workspace_owner", "open_workspace_credit_settings"]),
        recovery_url: v.optional(v.string()),
      },
      v.union([v.string(), v.array(v.string())]),
    ),
    code: v.picklist(["workspace_credits_exhausted"]),
    status: v.pipe(integer(), v.picklist([403])),
  }),
  v.looseObject({
    object: v.picklist(["error"]),
    message: v.string(),
    additional_data: v.objectWithRest(
      {
        tool_error_code: v.picklist(["agent_credit_limit_reached"]),
        tool_error_class: v.picklist(["entitlement_required"]),
        tool_error_retryable: v.picklist(["false"]),
        recovery_kind: v.picklist([
          "contact_workspace_owner",
          "none",
          "open_agent_settings",
          "request_agent_limit_increase",
          "request_pending",
        ]),
        recovery_url: v.optional(v.string()),
      },
      v.union([v.string(), v.array(v.string())]),
    ),
    code: v.picklist(["agent_credit_limit_reached"]),
    status: v.pipe(integer(), v.picklist([403])),
  }),
])

export const ErrorApi404: v.GenericSchema<unknown, T.ErrorApi404> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["object_not_found", "directory_not_found"]),
  status: v.pipe(integer(), v.picklist([404])),
})

export const ErrorApi406: v.GenericSchema<unknown, T.ErrorApi406> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["row_limit_exceeded"]),
  status: v.pipe(integer(), v.picklist([406])),
})

export const ErrorApi409: v.GenericSchema<unknown, T.ErrorApi409> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["conflict_error", "idempotency_key_reused", "agent_deleted"]),
  status: v.pipe(integer(), v.picklist([409])),
})

export const ErrorApi429: v.GenericSchema<unknown, T.ErrorApi429> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["rate_limited"]),
  status: v.pipe(integer(), v.picklist([429])),
})

export const ErrorApi500: v.GenericSchema<unknown, T.ErrorApi500> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["internal_server_error"]),
  status: v.pipe(integer(), v.picklist([500])),
})

export const ErrorApi503: v.GenericSchema<unknown, T.ErrorApi503> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["service_unavailable"]),
  status: v.pipe(integer(), v.picklist([503])),
})

export const ErrorApi504: v.GenericSchema<unknown, T.ErrorApi504> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["gateway_timeout"]),
  status: v.pipe(integer(), v.picklist([504])),
})

export const ErrorApi529: v.GenericSchema<unknown, T.ErrorApi529> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["service_overload"]),
  status: v.pipe(integer(), v.picklist([529])),
})

export const ErrorOauth400: v.GenericSchema<unknown, T.ErrorOauth400> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist([
    "invalid_request",
    "invalid_grant",
    "unauthorized_client",
    "unsupported_grant_type",
    "invalid_scope",
  ]),
  status: v.pipe(integer(), v.picklist([400])),
})

export const ErrorOauth401: v.GenericSchema<unknown, T.ErrorOauth401> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["invalid_client"]),
  status: v.pipe(integer(), v.picklist([401])),
})

export const ErrorOauth403: v.GenericSchema<unknown, T.ErrorOauth403> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["test_env_error"]),
  status: v.pipe(integer(), v.picklist([403])),
})

export const ErrorOauth500: v.GenericSchema<unknown, T.ErrorOauth500> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
  code: v.picklist(["internal_server_error"]),
  status: v.pipe(integer(), v.picklist([500])),
})

export const ExistencePropertyFilter: v.GenericSchema<unknown, T.ExistencePropertyFilter> = v.union([
  v.looseObject({
    is_empty: v.literal(true),
  }),
  v.looseObject({
    is_not_empty: v.literal(true),
  }),
])

export const ExpressionObjectResponse: v.GenericSchema<unknown, T.ExpressionObjectResponse> = v.looseObject({
  expression: v.string(),
})

export const ExternalFileRequest: v.GenericSchema<unknown, T.ExternalFileRequest> = v.looseObject({
  url: v.lazy(() => TextRequest),
})

export const ExternalInternalOrExternalFileWithNameResponse: v.GenericSchema<
  unknown,
  T.ExternalInternalOrExternalFileWithNameResponse
> = v.looseObject({
  type: v.picklist(["external"]),
  external: v.looseObject({
    url: v.string(),
  }),
})

export const ExternalMediaContentWithFileAndCaptionResponse: v.GenericSchema<
  unknown,
  T.ExternalMediaContentWithFileAndCaptionResponse
> = v.looseObject({
  type: v.picklist(["external"]),
  external: v.looseObject({
    url: v.lazy(() => TextRequest),
  }),
  caption: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
})

export const ExternalMediaContentWithFileNameAndCaptionResponse: v.GenericSchema<
  unknown,
  T.ExternalMediaContentWithFileNameAndCaptionResponse
> = v.looseObject({
  type: v.picklist(["external"]),
  external: v.looseObject({
    url: v.lazy(() => TextRequest),
  }),
  caption: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  name: v.string(),
})

export const ExternalPageCoverRequest: v.GenericSchema<unknown, T.ExternalPageCoverRequest> = v.looseObject({
  type: v.optional(v.picklist(["external"])),
  external: v.looseObject({
    url: v.string(),
  }),
})

export const ExternalPageCoverResponse: v.GenericSchema<unknown, T.ExternalPageCoverResponse> = v.looseObject({
  type: v.picklist(["external"]),
  external: v.looseObject({
    url: v.string(),
  }),
})

export const ExternalPageIconRequest: v.GenericSchema<unknown, T.ExternalPageIconRequest> = v.looseObject({
  type: v.optional(v.picklist(["external"])),
  external: v.looseObject({
    url: v.string(),
  }),
})

export const ExternalPageIconResponse: v.GenericSchema<unknown, T.ExternalPageIconResponse> = v.looseObject({
  type: v.picklist(["external"]),
  external: v.looseObject({
    url: v.string(),
  }),
})

export const FileBlockObjectResponse: v.GenericSchema<unknown, T.FileBlockObjectResponse> = v.looseObject({
  type: v.picklist(["file"]),
  file: v.lazy(() => MediaContentWithFileNameAndCaptionResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const FileInternalOrExternalFileWithNameResponse: v.GenericSchema<
  unknown,
  T.FileInternalOrExternalFileWithNameResponse
> = v.looseObject({
  type: v.picklist(["file"]),
  file: v.lazy(() => InternalFileResponse),
})

export const FileMediaContentWithFileAndCaptionResponse: v.GenericSchema<
  unknown,
  T.FileMediaContentWithFileAndCaptionResponse
> = v.looseObject({
  type: v.picklist(["file"]),
  file: v.lazy(() => InternalFileResponse),
  caption: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
})

export const FileMediaContentWithFileNameAndCaptionResponse: v.GenericSchema<
  unknown,
  T.FileMediaContentWithFileNameAndCaptionResponse
> = v.looseObject({
  type: v.picklist(["file"]),
  file: v.lazy(() => InternalFileResponse),
  caption: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  name: v.string(),
})

export const FilePageCoverResponse: v.GenericSchema<unknown, T.FilePageCoverResponse> = v.looseObject({
  type: v.picklist(["file"]),
  file: v.lazy(() => InternalFileResponse),
})

export const FilePageIconResponse: v.GenericSchema<unknown, T.FilePageIconResponse> = v.looseObject({
  type: v.picklist(["file"]),
  file: v.lazy(() => InternalFileResponse),
})

export const FileUploadCompletedWebhookPayload: v.GenericSchema<unknown, T.FileUploadCompletedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["file_upload.completed"]),
    entity: v.lazy(() => WebhookFileUploadEntity),
  })

export const FileUploadCreatedWebhookPayload: v.GenericSchema<unknown, T.FileUploadCreatedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["file_upload.created"]),
    entity: v.lazy(() => WebhookFileUploadEntity),
  })

export const FileUploadExpiredWebhookPayload: v.GenericSchema<unknown, T.FileUploadExpiredWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["file_upload.expired"]),
    entity: v.lazy(() => WebhookFileUploadEntity),
  })

export const FileUploadIdRequest: v.GenericSchema<unknown, T.FileUploadIdRequest> = v.looseObject({
  id: v.lazy(() => IdRequest),
})

export const FileUploadObjectResponse: v.GenericSchema<unknown, T.FileUploadObjectResponse> = v.looseObject({
  object: v.picklist(["file_upload"]),
  id: v.lazy(() => IdResponse),
  created_time: v.string(),
  created_by: v.looseObject({
    id: v.lazy(() => IdResponse),
    type: v.picklist(["person", "bot", "agent"]),
  }),
  last_edited_time: v.string(),
  in_trash: v.boolean(),
  expiry_time: v.nullable(v.union([v.string()])),
  status: v.picklist(["pending", "uploaded", "expired", "failed"]),
  filename: v.nullable(v.union([v.string()])),
  content_type: v.nullable(v.union([v.string()])),
  content_length: v.nullable(v.union([integer({ minimum: 0 })])),
  upload_url: v.optional(v.string()),
  complete_url: v.optional(v.string()),
  file_import_result: v.optional(
    v.union([
      v.looseObject({
        imported_time: v.string(),
        type: v.picklist(["success"]),
        success: v.lazy(() => EmptyObject),
      }),
      v.looseObject({
        imported_time: v.string(),
        type: v.picklist(["error"]),
        error: v.looseObject({
          type: v.picklist(["validation_error", "internal_system_error", "download_error", "upload_error"]),
          code: v.string(),
          message: v.string(),
          parameter: v.nullable(v.union([v.string()])),
          status_code: v.nullable(v.union([integer()])),
        }),
      }),
    ]),
  ),
  number_of_parts: v.optional(
    v.looseObject({
      total: integer({ minimum: 0 }),
      sent: integer({ minimum: 0 }),
    }),
  ),
})

export const FileUploadPageCoverRequest: v.GenericSchema<unknown, T.FileUploadPageCoverRequest> = v.looseObject({
  type: v.optional(v.picklist(["file_upload"])),
  file_upload: v.looseObject({
    id: v.string(),
  }),
})

export const FileUploadPageIconRequest: v.GenericSchema<unknown, T.FileUploadPageIconRequest> = v.looseObject({
  type: v.optional(v.picklist(["file_upload"])),
  file_upload: v.looseObject({
    id: v.string(),
  }),
})

export const FileUploadUploadFailedWebhookPayload: v.GenericSchema<unknown, T.FileUploadUploadFailedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["file_upload.upload_failed"]),
    entity: v.lazy(() => WebhookFileUploadEntity),
    data: v.looseObject({
      file_import_result: v.union([
        v.looseObject({
          type: v.picklist(["success"]),
          imported_time: v.string(),
          success: v.lazy(() => EmptyObject),
        }),
        v.looseObject({
          type: v.picklist(["error"]),
          imported_time: v.string(),
          error: v.looseObject({
            type: v.picklist(["validation_error", "internal_system_error", "download_error", "upload_error"]),
            code: v.string(),
            message: v.string(),
            parameter: v.nullable(v.union([v.string()])),
            status_code: v.nullable(v.union([integer()])),
          }),
        }),
      ]),
    }),
  })

export const FileUploadWithOptionalNameRequest: v.GenericSchema<unknown, T.FileUploadWithOptionalNameRequest> =
  v.looseObject({
    file_upload: v.lazy(() => FileUploadIdRequest),
    type: v.optional(v.picklist(["file_upload"])),
    name: v.optional(v.lazy(() => StringRequest)),
  })

export const FilesDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.FilesDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["files"]),
    files: v.lazy(() => EmptyObject),
  })

export const FilesPropertyConfigurationRequest: v.GenericSchema<unknown, T.FilesPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["files"])),
    files: v.lazy(() => EmptyObject),
  })

export const FilesPropertyItemObjectResponse: v.GenericSchema<unknown, T.FilesPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["files"]),
    files: v.pipe(v.array(v.lazy(() => InternalOrExternalFileWithNameResponse)), v.maxLength(100)),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const FilesSimplePropertyValueResponse: v.GenericSchema<unknown, T.FilesSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["files"]),
    files: v.pipe(v.array(v.lazy(() => InternalOrExternalFileWithNameResponse)), v.maxLength(100)),
  })

export const FormViewConfigRequest: v.GenericSchema<unknown, T.FormViewConfigRequest> = v.looseObject({
  type: v.picklist(["form"]),
  is_form_closed: v.optional(v.nullable(v.union([v.boolean()]))),
  anonymous_submissions: v.optional(v.nullable(v.union([v.boolean()]))),
  submission_permissions: v.optional(
    v.nullable(v.union([v.picklist(["none", "comment_only", "reader", "read_and_write", "editor"])])),
  ),
})

export const FormViewConfigResponse: v.GenericSchema<unknown, T.FormViewConfigResponse> = v.looseObject({
  type: v.picklist(["form"]),
  is_form_closed: v.optional(v.boolean()),
  anonymous_submissions: v.optional(v.boolean()),
  submission_permissions: v.optional(v.picklist(["none", "comment_only", "reader", "read_and_write", "editor"])),
})

export const FormulaCheckboxSubGroupByRequest: v.GenericSchema<unknown, T.FormulaCheckboxSubGroupByRequest> =
  v.looseObject({
    type: v.picklist(["checkbox"]),
    sort: v.lazy(() => GroupSortRequest),
  })

export const FormulaCheckboxSubGroupByResponse: v.GenericSchema<unknown, T.FormulaCheckboxSubGroupByResponse> =
  v.looseObject({
    type: v.picklist(["checkbox"]),
    sort: v.lazy(() => GroupSortResponse),
  })

export const FormulaDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.FormulaDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["formula"]),
    formula: v.looseObject({
      expression: v.string(),
    }),
  })

export const FormulaDateSubGroupByRequest: v.GenericSchema<unknown, T.FormulaDateSubGroupByRequest> = v.looseObject({
  type: v.picklist(["date"]),
  group_by: v.picklist(["relative", "day", "week", "month", "year"]),
  sort: v.lazy(() => GroupSortRequest),
  start_day_of_week: v.optional(number()),
})

export const FormulaDateSubGroupByResponse: v.GenericSchema<unknown, T.FormulaDateSubGroupByResponse> = v.looseObject({
  type: v.picklist(["date"]),
  group_by: v.picklist(["relative", "day", "week", "month", "year"]),
  sort: v.lazy(() => GroupSortResponse),
  start_day_of_week: v.optional(number()),
})

export const FormulaGroupByConfigRequest: v.GenericSchema<unknown, T.FormulaGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["formula"]),
  property_id: v.string(),
  group_by: v.union([
    v.lazy(() => FormulaDateSubGroupByRequest),
    v.lazy(() => FormulaTextSubGroupByRequest),
    v.lazy(() => FormulaNumberSubGroupByRequest),
    v.lazy(() => FormulaCheckboxSubGroupByRequest),
  ]),
  hide_empty_groups: v.optional(v.boolean()),
})

export const FormulaGroupByConfigResponse: v.GenericSchema<unknown, T.FormulaGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["formula"]),
  property_id: v.string(),
  group_by: v.lazy(() => FormulaSubGroupByResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
})

export const FormulaNumberSubGroupByRequest: v.GenericSchema<unknown, T.FormulaNumberSubGroupByRequest> = v.looseObject(
  {
    type: v.picklist(["number"]),
    sort: v.lazy(() => GroupSortRequest),
    range_start: v.optional(integer()),
    range_end: v.optional(integer()),
    range_size: v.optional(integer({ minimum: 1 })),
  },
)

export const FormulaNumberSubGroupByResponse: v.GenericSchema<unknown, T.FormulaNumberSubGroupByResponse> =
  v.looseObject({
    type: v.picklist(["number"]),
    sort: v.lazy(() => GroupSortResponse),
    range_start: v.optional(integer()),
    range_end: v.optional(integer()),
    range_size: v.optional(integer({ minimum: 1 })),
  })

export const FormulaPropertyConfigurationRequest: v.GenericSchema<unknown, T.FormulaPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["formula"])),
    formula: v.looseObject({
      expression: v.optional(v.string()),
    }),
  })

export const FormulaPropertyFilter: v.GenericSchema<unknown, T.FormulaPropertyFilter> = v.union([
  v.looseObject({
    string: v.lazy(() => TextPropertyFilter),
  }),
  v.looseObject({
    checkbox: v.lazy(() => CheckboxPropertyFilter),
  }),
  v.looseObject({
    number: v.lazy(() => NumberPropertyFilter),
  }),
  v.looseObject({
    date: v.lazy(() => DatePropertyFilter),
  }),
])

export const FormulaPropertyItemObjectResponse: v.GenericSchema<unknown, T.FormulaPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["formula"]),
    formula: v.lazy(() => FormulaPropertyResponse),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const FormulaPropertyResponse: v.GenericSchema<unknown, T.FormulaPropertyResponse> = v.union([
  v.lazy(() => StringFormulaPropertyResponse),
  v.lazy(() => DateFormulaPropertyResponse),
  v.lazy(() => NumberFormulaPropertyResponse),
  v.lazy(() => BooleanFormulaPropertyResponse),
  v.lazy(() => UnsupportedFormulaPropertyResponse),
])

export const FormulaPropertyValueResponse: v.GenericSchema<unknown, T.FormulaPropertyValueResponse> = v.union([
  v.lazy(() => BooleanFormulaPropertyValueResponse),
  v.lazy(() => DateFormulaPropertyValueResponse),
  v.lazy(() => NumberFormulaPropertyValueResponse),
  v.lazy(() => StringFormulaPropertyValueResponse),
  v.lazy(() => UnsupportedFormulaPropertyValueResponse),
])

export const FormulaSimplePropertyValueResponse: v.GenericSchema<unknown, T.FormulaSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["formula"]),
    formula: v.lazy(() => FormulaPropertyValueResponse),
  })

export const FormulaSubGroupByResponse: v.GenericSchema<unknown, T.FormulaSubGroupByResponse> = v.union([
  v.lazy(() => FormulaDateSubGroupByResponse),
  v.lazy(() => FormulaTextSubGroupByResponse),
  v.lazy(() => FormulaNumberSubGroupByResponse),
  v.lazy(() => FormulaCheckboxSubGroupByResponse),
])

export const FormulaTextSubGroupByRequest: v.GenericSchema<unknown, T.FormulaTextSubGroupByRequest> = v.looseObject({
  type: v.picklist(["text"]),
  group_by: v.picklist(["exact", "alphabet_prefix"]),
  sort: v.lazy(() => GroupSortRequest),
})

export const FormulaTextSubGroupByResponse: v.GenericSchema<unknown, T.FormulaTextSubGroupByResponse> = v.looseObject({
  type: v.picklist(["text"]),
  group_by: v.picklist(["exact", "alphabet_prefix"]),
  sort: v.lazy(() => GroupSortResponse),
})

export const GalleryViewConfigRequest: v.GenericSchema<unknown, T.GalleryViewConfigRequest> = v.looseObject({
  type: v.picklist(["gallery"]),
  properties: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewPropertyConfigRequest)), v.maxLength(100))])),
  ),
  cover: v.optional(v.nullable(v.union([v.lazy(() => CoverConfigRequest)]))),
  cover_size: v.optional(v.nullable(v.union([v.picklist(["small", "medium", "large"])]))),
  cover_aspect: v.optional(v.nullable(v.union([v.picklist(["contain", "cover"])]))),
  card_layout: v.optional(v.nullable(v.union([v.picklist(["list", "compact"])]))),
})

export const GalleryViewConfigResponse: v.GenericSchema<unknown, T.GalleryViewConfigResponse> = v.looseObject({
  type: v.picklist(["gallery"]),
  properties: v.optional(v.pipe(v.array(v.lazy(() => ViewPropertyConfigResponse)), v.maxLength(100))),
  cover: v.optional(v.lazy(() => CoverConfigResponse)),
  cover_size: v.optional(v.picklist(["small", "medium", "large"])),
  cover_aspect: v.optional(v.picklist(["contain", "cover"])),
  card_layout: v.optional(v.picklist(["list", "compact"])),
})

export const GroupByConfigRequest: v.GenericSchema<unknown, T.GroupByConfigRequest> = v.union([
  v.lazy(() => SelectGroupByConfigRequest),
  v.lazy(() => StatusGroupByConfigRequest),
  v.lazy(() => PersonGroupByConfigRequest),
  v.lazy(() => RelationGroupByConfigRequest),
  v.lazy(() => DateGroupByConfigRequest),
  v.lazy(() => TextGroupByConfigRequest),
  v.lazy(() => NumberGroupByConfigRequest),
  v.lazy(() => CheckboxGroupByConfigRequest),
  v.lazy(() => FormulaGroupByConfigRequest),
])

export const GroupByConfigResponse: v.GenericSchema<unknown, T.GroupByConfigResponse> = v.union([
  v.lazy(() => SelectGroupByConfigResponse),
  v.lazy(() => StatusGroupByConfigResponse),
  v.lazy(() => PersonGroupByConfigResponse),
  v.lazy(() => RelationGroupByConfigResponse),
  v.lazy(() => DateGroupByConfigResponse),
  v.lazy(() => TextGroupByConfigResponse),
  v.lazy(() => NumberGroupByConfigResponse),
  v.lazy(() => CheckboxGroupByConfigResponse),
  v.lazy(() => FormulaGroupByConfigResponse),
])

export const GroupFilterOperatorArray: v.GenericSchema<unknown, T.GroupFilterOperatorArray> = v.pipe(
  v.array(
    v.union([
      v.lazy(() => PropertyOrTimestampFilter),
      v.union([
        v.looseObject({
          or: v.lazy(() => PropertyOrTimestampFilterArray),
        }),
        v.looseObject({
          and: v.lazy(() => PropertyOrTimestampFilterArray),
        }),
      ]),
    ]),
  ),
  v.maxLength(100),
)

export const GroupObjectRequest: v.GenericSchema<unknown, T.GroupObjectRequest> = v.looseObject({
  id: v.lazy(() => IdRequest),
  name: v.optional(v.nullable(v.string())),
  object: v.optional(v.picklist(["group"])),
})

export const GroupObjectResponse: v.GenericSchema<unknown, T.GroupObjectResponse> = v.looseObject({
  id: v.lazy(() => IdResponse),
  object: v.picklist(["group"]),
  name: v.nullable(v.union([v.string()])),
})

export const GroupSortRequest: v.GenericSchema<unknown, T.GroupSortRequest> = v.looseObject({
  type: v.picklist(["manual", "ascending", "descending"]),
})

export const GroupSortResponse: v.GenericSchema<unknown, T.GroupSortResponse> = v.looseObject({
  type: v.picklist(["manual", "ascending", "descending"]),
})

export const HeaderContentWithRichTextAndColorRequest: v.GenericSchema<
  unknown,
  T.HeaderContentWithRichTextAndColorRequest
> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
  color: v.optional(v.lazy(() => ApiColor)),
  is_toggleable: v.optional(v.boolean()),
})

export const HeaderContentWithRichTextAndColorResponse: v.GenericSchema<
  unknown,
  T.HeaderContentWithRichTextAndColorResponse
> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  color: v.lazy(() => ApiColor),
  is_toggleable: v.boolean(),
})

export const HeaderContentWithSingleLevelOfChildrenRequest: v.GenericSchema<
  unknown,
  T.HeaderContentWithSingleLevelOfChildrenRequest
> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
  color: v.optional(v.lazy(() => ApiColor)),
  is_toggleable: v.optional(v.boolean()),
  children: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequestWithoutChildren)), v.maxLength(100))),
})

export const Heading1BlockObjectResponse: v.GenericSchema<unknown, T.Heading1BlockObjectResponse> = v.looseObject({
  type: v.picklist(["heading_1"]),
  heading_1: v.lazy(() => HeaderContentWithRichTextAndColorResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const Heading2BlockObjectResponse: v.GenericSchema<unknown, T.Heading2BlockObjectResponse> = v.looseObject({
  type: v.picklist(["heading_2"]),
  heading_2: v.lazy(() => HeaderContentWithRichTextAndColorResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const Heading3BlockObjectResponse: v.GenericSchema<unknown, T.Heading3BlockObjectResponse> = v.looseObject({
  type: v.picklist(["heading_3"]),
  heading_3: v.lazy(() => HeaderContentWithRichTextAndColorResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const Heading4BlockObjectResponse: v.GenericSchema<unknown, T.Heading4BlockObjectResponse> = v.looseObject({
  type: v.picklist(["heading_4"]),
  heading_4: v.lazy(() => HeaderContentWithRichTextAndColorResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const IconPageIconRequest: v.GenericSchema<unknown, T.IconPageIconRequest> = v.looseObject({
  type: v.optional(v.picklist(["icon"])),
  icon: v.looseObject({
    name: v.lazy(() => NoticonName),
    color: v.optional(v.lazy(() => NoticonColor)),
  }),
})

export const IconPageIconResponse: v.GenericSchema<unknown, T.IconPageIconResponse> = v.looseObject({
  type: v.picklist(["icon"]),
  icon: v.lazy(() => NoticonIconResponse),
})

export const IdObjectResponse: v.GenericSchema<unknown, T.IdObjectResponse> = v.looseObject({
  id: v.string(),
})

export const IdRequest: v.GenericSchema<unknown, T.IdRequest> = v.string()

export const IdResponse: v.GenericSchema<unknown, T.IdResponse> = v.string()

export const ImageBlockObjectResponse: v.GenericSchema<unknown, T.ImageBlockObjectResponse> = v.looseObject({
  type: v.picklist(["image"]),
  image: v.lazy(() => MediaContentWithFileAndCaptionResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const InitialDataSourceRequest: v.GenericSchema<unknown, T.InitialDataSourceRequest> = v.looseObject({
  properties: v.optional(
    v.record(
      v.string(),
      v.lazy(() => PropertyConfigurationRequest),
    ),
  ),
})

export const InternalFileRequest: v.GenericSchema<unknown, T.InternalFileRequest> = v.looseObject({
  url: v.string(),
  expiry_time: v.optional(v.string()),
})

export const InternalFileResponse: v.GenericSchema<unknown, T.InternalFileResponse> = v.looseObject({
  url: v.string(),
  expiry_time: v.string(),
})

export const InternalOrExternalFileWithNameRequest: v.GenericSchema<unknown, T.InternalOrExternalFileWithNameRequest> =
  v.union([
    v.looseObject({
      file: v.lazy(() => InternalFileRequest),
      name: v.lazy(() => StringRequest),
      type: v.optional(v.picklist(["file"])),
    }),
    v.looseObject({
      external: v.lazy(() => ExternalFileRequest),
      name: v.lazy(() => StringRequest),
      type: v.optional(v.picklist(["external"])),
    }),
  ])

export const InternalOrExternalFileWithNameResponse: v.GenericSchema<
  unknown,
  T.InternalOrExternalFileWithNameResponse
> = v.union([
  v.looseObject({
    name: v.string(),
    type: v.picklist(["file"]),
    file: v.lazy(() => InternalFileResponse),
  }),
  v.looseObject({
    name: v.string(),
    type: v.picklist(["external"]),
    external: v.looseObject({
      url: v.string(),
    }),
  }),
])

export const InternalOrExternalFileWithNameResponseCommon: v.GenericSchema<
  unknown,
  T.InternalOrExternalFileWithNameResponseCommon
> = v.looseObject({
  name: v.string(),
})

export const LanguageRequest: v.GenericSchema<unknown, T.LanguageRequest> = v.picklist([
  "abap",
  "abc",
  "agda",
  "arduino",
  "ascii art",
  "assembly",
  "bash",
  "basic",
  "bnf",
  "c",
  "c#",
  "c++",
  "clojure",
  "coffeescript",
  "coq",
  "css",
  "dart",
  "dhall",
  "diff",
  "docker",
  "ebnf",
  "elixir",
  "elm",
  "erlang",
  "f#",
  "flow",
  "fortran",
  "gherkin",
  "glsl",
  "go",
  "graphql",
  "groovy",
  "haskell",
  "hcl",
  "html",
  "idris",
  "java",
  "javascript",
  "json",
  "julia",
  "kotlin",
  "latex",
  "less",
  "lisp",
  "livescript",
  "llvm ir",
  "lua",
  "makefile",
  "markdown",
  "markup",
  "matlab",
  "mathematica",
  "mermaid",
  "nix",
  "notion formula",
  "objective-c",
  "ocaml",
  "pascal",
  "perl",
  "php",
  "plain text",
  "powershell",
  "prolog",
  "protobuf",
  "purescript",
  "python",
  "r",
  "racket",
  "reason",
  "ruby",
  "rust",
  "sass",
  "scala",
  "scheme",
  "scss",
  "shell",
  "smalltalk",
  "solidity",
  "sql",
  "swift",
  "toml",
  "typescript",
  "vb.net",
  "verilog",
  "vhdl",
  "visual basic",
  "webassembly",
  "xml",
  "yaml",
  "java/c/c++/c#",
])

export const LastEditedByDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.LastEditedByDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["last_edited_by"]),
  last_edited_by: v.lazy(() => EmptyObject),
})

export const LastEditedByPropertyConfigurationRequest: v.GenericSchema<
  unknown,
  T.LastEditedByPropertyConfigurationRequest
> = v.looseObject({
  type: v.optional(v.picklist(["last_edited_by"])),
  last_edited_by: v.lazy(() => EmptyObject),
})

export const LastEditedByPropertyItemObjectResponse: v.GenericSchema<
  unknown,
  T.LastEditedByPropertyItemObjectResponse
> = v.looseObject({
  type: v.picklist(["last_edited_by"]),
  last_edited_by: v.union([v.lazy(() => PartialUserObjectResponse), v.lazy(() => UserObjectResponse)]),
  object: v.picklist(["property_item"]),
  id: v.string(),
})

export const LastEditedBySimplePropertyValueResponse: v.GenericSchema<
  unknown,
  T.LastEditedBySimplePropertyValueResponse
> = v.looseObject({
  type: v.picklist(["last_edited_by"]),
  last_edited_by: v.lazy(() => UserValueResponse),
})

export const LastEditedTimeDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.LastEditedTimeDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["last_edited_time"]),
  last_edited_time: v.lazy(() => EmptyObject),
})

export const LastEditedTimePropertyConfigurationRequest: v.GenericSchema<
  unknown,
  T.LastEditedTimePropertyConfigurationRequest
> = v.looseObject({
  type: v.optional(v.picklist(["last_edited_time"])),
  last_edited_time: v.lazy(() => EmptyObject),
})

export const LastEditedTimePropertyItemObjectResponse: v.GenericSchema<
  unknown,
  T.LastEditedTimePropertyItemObjectResponse
> = v.looseObject({
  type: v.picklist(["last_edited_time"]),
  last_edited_time: v.string(),
  object: v.picklist(["property_item"]),
  id: v.string(),
})

export const LastEditedTimeSimplePropertyValueResponse: v.GenericSchema<
  unknown,
  T.LastEditedTimeSimplePropertyValueResponse
> = v.looseObject({
  type: v.picklist(["last_edited_time"]),
  last_edited_time: v.string(),
})

export const LastVisitedTimePropertyConfigurationRequest: v.GenericSchema<
  unknown,
  T.LastVisitedTimePropertyConfigurationRequest
> = v.looseObject({
  type: v.optional(v.picklist(["last_visited_time"])),
  last_visited_time: v.lazy(() => EmptyObject),
})

export const LinkMentionResponse: v.GenericSchema<unknown, T.LinkMentionResponse> = v.looseObject({
  href: v.string(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  link_author: v.optional(v.string()),
  link_provider: v.optional(v.string()),
  thumbnail_url: v.optional(v.string()),
  icon_url: v.optional(v.string()),
  iframe_url: v.optional(v.string()),
  height: v.optional(integer()),
  padding: v.optional(integer()),
  padding_top: v.optional(integer()),
})

export const LinkPreviewBlockObjectResponse: v.GenericSchema<unknown, T.LinkPreviewBlockObjectResponse> = v.looseObject(
  {
    type: v.picklist(["link_preview"]),
    link_preview: v.lazy(() => MediaContentWithUrlResponse),
    parent: v.lazy(() => ParentForBlockBasedObjectResponse),
    object: v.picklist(["block"]),
    id: v.string(),
    created_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_time: v.string(),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  },
)

export const LinkPreviewMentionResponse: v.GenericSchema<unknown, T.LinkPreviewMentionResponse> = v.looseObject({
  url: v.string(),
})

export const LinkToPageBlockObjectResponse: v.GenericSchema<unknown, T.LinkToPageBlockObjectResponse> = v.looseObject({
  type: v.picklist(["link_to_page"]),
  link_to_page: v.union([
    v.looseObject({
      type: v.picklist(["page_id"]),
      page_id: v.lazy(() => IdRequest),
    }),
    v.looseObject({
      type: v.picklist(["database_id"]),
      database_id: v.lazy(() => IdRequest),
    }),
    v.looseObject({
      type: v.picklist(["comment_id"]),
      comment_id: v.lazy(() => IdRequest),
    }),
  ]),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const ListViewConfigRequest: v.GenericSchema<unknown, T.ListViewConfigRequest> = v.looseObject({
  type: v.picklist(["list"]),
  properties: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewPropertyConfigRequest)), v.maxLength(100))])),
  ),
})

export const ListViewConfigResponse: v.GenericSchema<unknown, T.ListViewConfigResponse> = v.looseObject({
  type: v.picklist(["list"]),
  properties: v.optional(v.pipe(v.array(v.lazy(() => ViewPropertyConfigResponse)), v.maxLength(100))),
})

export const LocationPropertyConfigurationRequest: v.GenericSchema<unknown, T.LocationPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["location"])),
    location: v.lazy(() => EmptyObject),
  })

export const MapViewConfigRequest: v.GenericSchema<unknown, T.MapViewConfigRequest> = v.looseObject({
  type: v.picklist(["map"]),
  height: v.optional(v.nullable(v.union([v.picklist(["small", "medium", "large", "extra_large"])]))),
  map_by: v.optional(v.nullable(v.union([v.string()]))),
  properties: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewPropertyConfigRequest)), v.maxLength(100))])),
  ),
})

export const MapViewConfigResponse: v.GenericSchema<unknown, T.MapViewConfigResponse> = v.looseObject({
  type: v.picklist(["map"]),
  height: v.optional(v.picklist(["small", "medium", "large", "extra_large"])),
  map_by: v.optional(v.string()),
  map_by_property_name: v.optional(v.string()),
  properties: v.optional(v.pipe(v.array(v.lazy(() => ViewPropertyConfigResponse)), v.maxLength(100))),
})

export const MediaContentWithFileAndCaptionRequest: v.GenericSchema<unknown, T.MediaContentWithFileAndCaptionRequest> =
  v.union([
    v.looseObject({
      external: v.lazy(() => ExternalFileRequest),
      type: v.optional(v.picklist(["external"])),
      caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
    }),
    v.looseObject({
      file_upload: v.lazy(() => FileUploadIdRequest),
      type: v.optional(v.picklist(["file_upload"])),
      caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
    }),
  ])

export const MediaContentWithFileAndCaptionResponse: v.GenericSchema<
  unknown,
  T.MediaContentWithFileAndCaptionResponse
> = v.union([
  v.lazy(() => ExternalMediaContentWithFileAndCaptionResponse),
  v.lazy(() => FileMediaContentWithFileAndCaptionResponse),
])

export const MediaContentWithFileNameAndCaptionRequest: v.GenericSchema<
  unknown,
  T.MediaContentWithFileNameAndCaptionRequest
> = v.union([
  v.looseObject({
    external: v.lazy(() => ExternalFileRequest),
    type: v.optional(v.picklist(["external"])),
    caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
    name: v.optional(v.lazy(() => StringRequest)),
  }),
  v.looseObject({
    file_upload: v.lazy(() => FileUploadIdRequest),
    type: v.optional(v.picklist(["file_upload"])),
    caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
    name: v.optional(v.lazy(() => StringRequest)),
  }),
])

export const MediaContentWithFileNameAndCaptionResponse: v.GenericSchema<
  unknown,
  T.MediaContentWithFileNameAndCaptionResponse
> = v.union([
  v.lazy(() => ExternalMediaContentWithFileNameAndCaptionResponse),
  v.lazy(() => FileMediaContentWithFileNameAndCaptionResponse),
])

export const MediaContentWithUrlAndCaptionRequest: v.GenericSchema<unknown, T.MediaContentWithUrlAndCaptionRequest> =
  v.looseObject({
    url: v.string(),
    caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  })

export const MediaContentWithUrlAndCaptionResponse: v.GenericSchema<unknown, T.MediaContentWithUrlAndCaptionResponse> =
  v.looseObject({
    url: v.string(),
    caption: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  })

export const MediaContentWithUrlResponse: v.GenericSchema<unknown, T.MediaContentWithUrlResponse> = v.looseObject({
  url: v.lazy(() => TextRequest),
})

export const MeetingNotesBlockObjectResponse: v.GenericSchema<unknown, T.MeetingNotesBlockObjectResponse> =
  v.looseObject({
    type: v.picklist(["meeting_notes"]),
    meeting_notes: v.lazy(() => TranscriptionBlockResponse),
    parent: v.lazy(() => ParentForBlockBasedObjectResponse),
    object: v.picklist(["block"]),
    id: v.string(),
    created_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_time: v.string(),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  })

export const MeetingNotesPropertyFilter: v.GenericSchema<unknown, T.MeetingNotesPropertyFilter> = v.looseObject({
  property: v.picklist([
    "title",
    "attendees",
    "created_time",
    "created_by",
    "last_edited_time",
    "last_edited_by",
    "notion://meeting_notes/attendees",
  ]),
  filter: v.union([
    v.looseObject({
      operator: v.picklist([
        "string_is",
        "string_is_not",
        "string_contains",
        "string_does_not_contain",
        "string_starts_with",
        "string_ends_with",
      ]),
      value: v.looseObject({
        type: v.picklist(["exact"]),
        value: v.string(),
      }),
    }),
    v.looseObject({
      operator: v.picklist(["person_contains", "person_does_not_contain"]),
      value: v.pipe(
        v.array(
          v.union([
            v.looseObject({
              type: v.picklist(["exact"]),
              value: v.looseObject({
                table: v.picklist(["notion_user"]),
                id: v.string(),
              }),
            }),
            v.looseObject({
              type: v.picklist(["relative"]),
              value: v.picklist(["me"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    }),
    v.looseObject({
      operator: v.picklist([
        "date_is",
        "date_is_before",
        "date_is_after",
        "date_is_on_or_before",
        "date_is_on_or_after",
      ]),
      value: v.union([
        v.looseObject({
          type: v.picklist(["relative"]),
          value: v.picklist([
            "today",
            "tomorrow",
            "yesterday",
            "one_week_ago",
            "one_week_from_now",
            "one_month_ago",
            "one_month_from_now",
          ]),
        }),
        v.looseObject({
          type: v.picklist(["exact"]),
          value: v.union([
            v.looseObject({
              type: v.picklist(["date"]),
              start_date: v.string(),
            }),
            v.looseObject({
              type: v.picklist(["datetime"]),
              start_date: v.string(),
              start_time: v.string(),
              time_zone: v.string(),
            }),
          ]),
        }),
      ]),
      use_end: v.optional(v.boolean()),
    }),
    v.looseObject({
      operator: v.picklist(["date_is_within", "date_is_relative_to"]),
      value: v.union([
        v.looseObject({
          type: v.picklist(["relative"]),
          value: v.picklist(["custom"]),
          direction: v.picklist(["past", "future"]),
          unit: v.picklist(["year", "month", "week", "day"]),
          count: integer({ minimum: 1 }),
        }),
        v.looseObject({
          type: v.picklist(["relative"]),
          value: v.picklist(["surrounding"]),
          unit: v.picklist(["year", "month", "week", "day"]),
        }),
        v.looseObject({
          type: v.picklist(["relative"]),
          value: v.picklist([
            "this_week",
            "the_past_week",
            "the_past_month",
            "the_past_year",
            "the_next_week",
            "the_next_month",
            "the_next_year",
          ]),
        }),
        v.looseObject({
          type: v.picklist(["exact"]),
          value: v.looseObject({
            type: v.picklist(["daterange"]),
            start_date: v.optional(v.string()),
            end_date: v.optional(v.string()),
          }),
        }),
      ]),
      use_end: v.optional(v.boolean()),
    }),
    v.looseObject({
      operator: v.picklist(["is_empty", "is_not_empty"]),
    }),
  ]),
})

export const MentionRichTextItemRequest: v.GenericSchema<unknown, T.MentionRichTextItemRequest> = v.looseObject({
  type: v.optional(v.picklist(["mention"])),
  mention: v.union([
    v.looseObject({
      type: v.optional(v.picklist(["user"])),
      user: v.lazy(() => PartialUserObjectRequest),
    }),
    v.looseObject({
      type: v.optional(v.picklist(["date"])),
      date: v.lazy(() => DateRequest),
    }),
    v.looseObject({
      type: v.optional(v.picklist(["page"])),
      page: v.looseObject({
        id: v.lazy(() => IdRequest),
      }),
    }),
    v.looseObject({
      type: v.optional(v.picklist(["database"])),
      database: v.looseObject({
        id: v.lazy(() => IdRequest),
      }),
    }),
    v.looseObject({
      type: v.optional(v.picklist(["template_mention"])),
      template_mention: v.lazy(() => TemplateMentionRequest),
    }),
    v.looseObject({
      type: v.optional(v.picklist(["custom_emoji"])),
      custom_emoji: v.looseObject({
        id: v.lazy(() => IdRequest),
        name: v.optional(v.string()),
        url: v.optional(v.string()),
      }),
    }),
  ]),
})

export const MentionRichTextItemResponse: v.GenericSchema<unknown, T.MentionRichTextItemResponse> = v.looseObject({
  type: v.picklist(["mention"]),
  mention: v.union([
    v.looseObject({
      type: v.picklist(["user"]),
      user: v.lazy(() => UserValueResponse),
    }),
    v.looseObject({
      type: v.picklist(["date"]),
      date: v.lazy(() => DateResponse),
    }),
    v.looseObject({
      type: v.picklist(["link_preview"]),
      link_preview: v.lazy(() => LinkPreviewMentionResponse),
    }),
    v.looseObject({
      type: v.picklist(["link_mention"]),
      link_mention: v.lazy(() => LinkMentionResponse),
    }),
    v.looseObject({
      type: v.picklist(["page"]),
      page: v.looseObject({
        id: v.lazy(() => IdResponse),
      }),
    }),
    v.looseObject({
      type: v.picklist(["database"]),
      database: v.looseObject({
        id: v.lazy(() => IdResponse),
      }),
    }),
    v.looseObject({
      type: v.picklist(["template_mention"]),
      template_mention: v.lazy(() => TemplateMentionResponse),
    }),
    v.looseObject({
      type: v.picklist(["custom_emoji"]),
      custom_emoji: v.lazy(() => CustomEmojiResponse),
    }),
  ]),
})

export const MultiSelectDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.MultiSelectDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["multi_select"]),
  multi_select: v.looseObject({
    options: v.pipe(v.array(v.lazy(() => SelectPropertyResponse)), v.maxLength(100)),
  }),
})

export const MultiSelectPropertyConfigurationRequest: v.GenericSchema<
  unknown,
  T.MultiSelectPropertyConfigurationRequest
> = v.looseObject({
  type: v.optional(v.picklist(["multi_select"])),
  multi_select: v.looseObject({
    options: v.optional(
      v.pipe(
        v.array(
          v.looseObject({
            name: v.string(),
            color: v.optional(v.lazy(() => SelectColor)),
            description: v.optional(v.nullable(v.union([v.string()]))),
          }),
        ),
        v.maxLength(100),
      ),
    ),
  }),
})

export const MultiSelectPropertyFilter: v.GenericSchema<unknown, T.MultiSelectPropertyFilter> = v.union([
  v.union([
    v.looseObject({
      contains: v.lazy(() => StringOrStringArray),
    }),
    v.looseObject({
      does_not_contain: v.lazy(() => StringOrStringArray),
    }),
  ]),
  v.lazy(() => ExistencePropertyFilter),
])

export const MultiSelectPropertyItemObjectResponse: v.GenericSchema<unknown, T.MultiSelectPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["multi_select"]),
    multi_select: v.pipe(v.array(v.lazy(() => PartialSelectResponse)), v.maxLength(100)),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const MultiSelectSimplePropertyValueResponse: v.GenericSchema<
  unknown,
  T.MultiSelectSimplePropertyValueResponse
> = v.looseObject({
  type: v.picklist(["multi_select"]),
  multi_select: v.pipe(v.array(v.lazy(() => PartialSelectPropertyValueResponse)), v.maxLength(100)),
})

export const NonTerminalAsyncTaskStatus: v.GenericSchema<unknown, T.NonTerminalAsyncTaskStatus> = v.picklist([
  "queued",
  "running",
  "retrying",
])

export const NoticonColor: v.GenericSchema<unknown, T.NoticonColor> = v.picklist([
  "gray",
  "lightgray",
  "brown",
  "yellow",
  "orange",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
])

export const NoticonIconResponse: v.GenericSchema<unknown, T.NoticonIconResponse> = v.looseObject({
  name: v.lazy(() => NoticonName),
  color: v.lazy(() => NoticonColor),
})

export const NoticonName: v.GenericSchema<unknown, T.NoticonName> = v.string()

export const NumberDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.NumberDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["number"]),
    number: v.looseObject({
      format: v.lazy(() => NumberFormat),
    }),
  })

export const NumberFormat: v.GenericSchema<unknown, T.NumberFormat> = v.string()

export const NumberFormulaPropertyResponse: v.GenericSchema<unknown, T.NumberFormulaPropertyResponse> = v.looseObject({
  type: v.picklist(["number"]),
  number: v.nullable(number()),
})

export const NumberFormulaPropertyValueResponse: v.GenericSchema<unknown, T.NumberFormulaPropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["number"]),
    number: v.nullable(v.union([number()])),
  })

export const NumberGroupByConfigRequest: v.GenericSchema<unknown, T.NumberGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["number"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortRequest),
  hide_empty_groups: v.optional(v.boolean()),
  range_start: v.optional(integer()),
  range_end: v.optional(integer()),
  range_size: v.optional(integer({ minimum: 1 })),
})

export const NumberGroupByConfigResponse: v.GenericSchema<unknown, T.NumberGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["number"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
  range_start: v.optional(integer()),
  range_end: v.optional(integer()),
  range_size: v.optional(integer({ minimum: 1 })),
})

export const NumberPartialRollupValueResponse: v.GenericSchema<unknown, T.NumberPartialRollupValueResponse> =
  v.looseObject({
    type: v.picklist(["number"]),
    number: v.nullable(v.union([number()])),
  })

export const NumberPropertyConfigurationRequest: v.GenericSchema<unknown, T.NumberPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["number"])),
    number: v.looseObject({
      format: v.optional(v.lazy(() => NumberFormat)),
    }),
  })

export const NumberPropertyFilter: v.GenericSchema<unknown, T.NumberPropertyFilter> = v.union([
  v.union([
    v.looseObject({
      equals: number(),
    }),
    v.looseObject({
      does_not_equal: number(),
    }),
    v.looseObject({
      greater_than: number(),
    }),
    v.looseObject({
      less_than: number(),
    }),
    v.looseObject({
      greater_than_or_equal_to: number(),
    }),
    v.looseObject({
      less_than_or_equal_to: number(),
    }),
  ]),
  v.lazy(() => ExistencePropertyFilter),
])

export const NumberPropertyItemObjectResponse: v.GenericSchema<unknown, T.NumberPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["number"]),
    number: v.nullable(number()),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const NumberSimplePropertyValueResponse: v.GenericSchema<unknown, T.NumberSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["number"]),
    number: v.nullable(v.union([number()])),
  })

export const NumberedListFormat: v.GenericSchema<unknown, T.NumberedListFormat> = v.picklist([
  "numbers",
  "letters",
  "roman",
])

export const NumberedListItemBlockObjectResponse: v.GenericSchema<unknown, T.NumberedListItemBlockObjectResponse> =
  v.looseObject({
    type: v.picklist(["numbered_list_item"]),
    numbered_list_item: v.lazy(() => ContentWithRichTextAndColorAndListResponse),
    parent: v.lazy(() => ParentForBlockBasedObjectResponse),
    object: v.picklist(["block"]),
    id: v.string(),
    created_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_time: v.string(),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  })

export const PageContentUpdatedWebhookPayload: v.GenericSchema<unknown, T.PageContentUpdatedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["page.content_updated"]),
    entity: v.lazy(() => WebhookPageEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
      updated_blocks: v.pipe(v.array(v.lazy(() => WebhookUpdatedBlock)), v.maxLength(100)),
    }),
  })

export const PageCoverRequest: v.GenericSchema<unknown, T.PageCoverRequest> = v.union([
  v.lazy(() => FileUploadPageCoverRequest),
  v.lazy(() => ExternalPageCoverRequest),
])

export const PageCoverResponse: v.GenericSchema<unknown, T.PageCoverResponse> = v.union([
  v.lazy(() => FilePageCoverResponse),
  v.lazy(() => ExternalPageCoverResponse),
])

export const PageCreatedWebhookPayload: v.GenericSchema<unknown, T.PageCreatedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["page.created"]),
  entity: v.lazy(() => WebhookPageEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const PageDeletedWebhookPayload: v.GenericSchema<unknown, T.PageDeletedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["page.deleted"]),
  entity: v.lazy(() => WebhookPageEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const PageIconRequest: v.GenericSchema<unknown, T.PageIconRequest> = v.union([
  v.lazy(() => FileUploadPageIconRequest),
  v.lazy(() => EmojiPageIconRequest),
  v.lazy(() => ExternalPageIconRequest),
  v.lazy(() => CustomEmojiPageIconRequest),
  v.lazy(() => IconPageIconRequest),
])

export const PageIconResponse: v.GenericSchema<unknown, T.PageIconResponse> = v.union([
  v.lazy(() => EmojiPageIconResponse),
  v.lazy(() => FilePageIconResponse),
  v.lazy(() => ExternalPageIconResponse),
  v.lazy(() => CustomEmojiPageIconResponse),
  v.lazy(() => IconPageIconResponse),
])

export const PageIdCommentParentResponse: v.GenericSchema<unknown, T.PageIdCommentParentResponse> = v.looseObject({
  type: v.picklist(["page_id"]),
  page_id: v.lazy(() => IdResponse),
})

export const PageIdParentForBlockBasedObjectResponse: v.GenericSchema<
  unknown,
  T.PageIdParentForBlockBasedObjectResponse
> = v.looseObject({
  type: v.picklist(["page_id"]),
  page_id: v.lazy(() => IdResponse),
})

export const PageLockedWebhookPayload: v.GenericSchema<unknown, T.PageLockedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["page.locked"]),
  entity: v.lazy(() => WebhookPageEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const PageMarkdownResponse: v.GenericSchema<unknown, T.PageMarkdownResponse> = v.looseObject({
  object: v.picklist(["page_markdown"]),
  id: v.lazy(() => IdResponse),
  markdown: v.string(),
  truncated: v.boolean(),
  unknown_block_ids: v.pipe(v.array(v.lazy(() => IdResponse)), v.maxLength(100)),
  warnings: v.optional(
    v.pipe(
      v.array(
        v.looseObject({
          code: v.string(),
          message: v.string(),
        }),
      ),
      v.maxLength(100),
    ),
  ),
})

export const PageMovedWebhookPayload: v.GenericSchema<unknown, T.PageMovedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["page.moved"]),
  entity: v.lazy(() => WebhookPageEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const PageObjectResponse: v.GenericSchema<unknown, T.PageObjectResponse> = v.looseObject({
  object: v.picklist(["page"]),
  id: v.lazy(() => IdResponse),
  created_time: v.string(),
  last_edited_time: v.string(),
  in_trash: v.boolean(),
  is_archived: v.boolean(),
  is_locked: v.boolean(),
  url: v.string(),
  public_url: v.nullable(v.union([v.string()])),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  properties: v.record(
    v.string(),
    v.lazy(() => PagePropertyValueWithIdResponse),
  ),
  icon: v.nullable(v.union([v.lazy(() => PageIconResponse)])),
  cover: v.nullable(v.union([v.lazy(() => PageCoverResponse)])),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
})

export const PageOrDataSourceListResponse: v.GenericSchema<unknown, T.PageOrDataSourceListResponse> = v.looseObject({
  type: v.picklist(["page_or_data_source"]),
  page_or_data_source: v.lazy(() => EmptyObject),
  object: v.picklist(["list"]),
  next_cursor: v.nullable(v.string()),
  has_more: v.boolean(),
  results: v.array(
    v.union([
      v.union([v.lazy(() => PageObjectResponse), v.lazy(() => PartialPageObjectResponse)]),
      v.union([v.lazy(() => PartialDataSourceObjectResponse), v.lazy(() => DataSourceObjectResponse)]),
    ]),
  ),
  request_status: v.optional(
    v.looseObject({
      type: v.picklist(["complete", "incomplete"]),
      incomplete_reason: v.optional(v.picklist(["query_result_limit_reached"])),
    }),
  ),
})

export const PagePositionSchema: v.GenericSchema<unknown, T.PagePositionSchema> = v.union([
  v.looseObject({
    type: v.picklist(["after_block"]),
    after_block: v.looseObject({
      id: v.lazy(() => IdRequest),
    }),
  }),
  v.looseObject({
    type: v.picklist(["page_start"]),
  }),
  v.looseObject({
    type: v.picklist(["page_end"]),
  }),
])

export const PagePropertiesRequest: v.GenericSchema<unknown, T.PagePropertiesRequest> = v.record(
  v.string(),
  v.union([
    v.looseObject({
      title: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      type: v.optional(v.picklist(["title"])),
    }),
    v.looseObject({
      rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
      type: v.optional(v.picklist(["rich_text"])),
    }),
    v.looseObject({
      number: v.nullable(number()),
      type: v.optional(v.picklist(["number"])),
    }),
    v.looseObject({
      url: v.nullable(v.union([v.lazy(() => TextRequest)])),
      type: v.optional(v.picklist(["url"])),
    }),
    v.looseObject({
      select: v.nullable(
        v.union([
          v.looseObject({
            id: v.lazy(() => StringRequest),
            name: v.optional(v.lazy(() => TextRequest)),
            color: v.optional(v.lazy(() => SelectColor)),
            description: v.optional(v.nullable(v.union([v.lazy(() => TextRequest)]))),
          }),
          v.looseObject({
            name: v.lazy(() => TextRequest),
            id: v.optional(v.lazy(() => StringRequest)),
            color: v.optional(v.lazy(() => SelectColor)),
            description: v.optional(v.nullable(v.union([v.lazy(() => TextRequest)]))),
          }),
        ]),
      ),
      type: v.optional(v.picklist(["select"])),
    }),
    v.looseObject({
      multi_select: v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => StringRequest),
              name: v.optional(v.lazy(() => TextRequest)),
              color: v.optional(v.lazy(() => SelectColor)),
              description: v.optional(v.nullable(v.union([v.lazy(() => TextRequest)]))),
            }),
            v.looseObject({
              name: v.lazy(() => TextRequest),
              id: v.optional(v.lazy(() => StringRequest)),
              color: v.optional(v.lazy(() => SelectColor)),
              description: v.optional(v.nullable(v.union([v.lazy(() => TextRequest)]))),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
      type: v.optional(v.picklist(["multi_select"])),
    }),
    v.looseObject({
      people: v.pipe(
        v.array(v.union([v.lazy(() => PartialUserObjectRequest), v.lazy(() => GroupObjectRequest)])),
        v.maxLength(100),
      ),
      type: v.optional(v.picklist(["people"])),
    }),
    v.looseObject({
      email: v.nullable(v.union([v.lazy(() => StringRequest)])),
      type: v.optional(v.picklist(["email"])),
    }),
    v.looseObject({
      phone_number: v.nullable(v.union([v.lazy(() => StringRequest)])),
      type: v.optional(v.picklist(["phone_number"])),
    }),
    v.looseObject({
      date: v.nullable(v.union([v.lazy(() => DateRequest)])),
      type: v.optional(v.picklist(["date"])),
    }),
    v.looseObject({
      checkbox: v.boolean(),
      type: v.optional(v.picklist(["checkbox"])),
    }),
    v.looseObject({
      relation: v.pipe(v.array(v.lazy(() => RelationItemPropertyValueResponse)), v.maxLength(100)),
      type: v.optional(v.picklist(["relation"])),
    }),
    v.looseObject({
      files: v.pipe(
        v.array(
          v.union([
            v.lazy(() => InternalOrExternalFileWithNameRequest),
            v.lazy(() => FileUploadWithOptionalNameRequest),
          ]),
        ),
        v.maxLength(100),
      ),
      type: v.optional(v.picklist(["files"])),
    }),
    v.looseObject({
      status: v.nullable(
        v.union([
          v.looseObject({
            id: v.lazy(() => StringRequest),
            name: v.optional(v.lazy(() => TextRequest)),
            color: v.optional(v.lazy(() => SelectColor)),
            description: v.optional(v.nullable(v.union([v.lazy(() => TextRequest)]))),
          }),
          v.looseObject({
            name: v.lazy(() => TextRequest),
            id: v.optional(v.lazy(() => StringRequest)),
            color: v.optional(v.lazy(() => SelectColor)),
            description: v.optional(v.nullable(v.union([v.lazy(() => TextRequest)]))),
          }),
        ]),
      ),
      type: v.optional(v.picklist(["status"])),
    }),
    v.looseObject({
      place: v.nullable(
        v.looseObject({
          lat: number(),
          lon: number(),
          name: v.optional(v.nullable(v.string())),
          address: v.optional(v.nullable(v.string())),
          aws_place_id: v.optional(v.nullable(v.string())),
          google_place_id: v.optional(v.nullable(v.string())),
        }),
      ),
      type: v.optional(v.picklist(["place"])),
    }),
    v.looseObject({
      verification: v.union([
        v.looseObject({
          state: v.picklist(["verified"]),
          date: v.optional(v.lazy(() => DateRequest)),
        }),
        v.looseObject({
          state: v.picklist(["unverified"]),
        }),
      ]),
      type: v.optional(v.picklist(["verification"])),
    }),
  ]),
)

export const PagePropertiesUpdatedWebhookPayload: v.GenericSchema<unknown, T.PagePropertiesUpdatedWebhookPayload> =
  v.looseObject({
    id: v.string(),
    timestamp: v.string(),
    workspace_id: v.lazy(() => IdResponse),
    workspace_name: v.string(),
    subscription_id: v.lazy(() => IdResponse),
    integration_id: v.lazy(() => IdResponse),
    authors: v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
    attempt_number: integer(),
    api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
    accessible_by: v.optional(
      v.pipe(
        v.array(
          v.union([
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["person"]),
            }),
            v.looseObject({
              id: v.lazy(() => IdResponse),
              type: v.picklist(["bot"]),
            }),
          ]),
        ),
        v.maxLength(100),
      ),
    ),
    type: v.picklist(["page.properties_updated"]),
    entity: v.lazy(() => WebhookPageEntity),
    data: v.looseObject({
      parent: v.lazy(() => WebhookParentBlock),
      updated_properties: v.pipe(v.array(v.string()), v.maxLength(100)),
    }),
  })

export const PagePropertyValueWithIdResponse: v.GenericSchema<unknown, T.PagePropertyValueWithIdResponse> = v.union([
  v.union([
    v.union([
      v.looseObject({
        id: v.string(),
        type: v.picklist(["number"]),
        number: v.nullable(v.union([number()])),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["url"]),
        url: v.nullable(v.union([v.string()])),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["select"]),
        select: v.nullable(v.union([v.lazy(() => PartialSelectPropertyValueResponse)])),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["multi_select"]),
        multi_select: v.pipe(v.array(v.lazy(() => PartialSelectPropertyValueResponse)), v.maxLength(100)),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["status"]),
        status: v.nullable(v.union([v.lazy(() => PartialSelectPropertyValueResponse)])),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["date"]),
        date: v.nullable(v.union([v.lazy(() => DateResponse)])),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["email"]),
        email: v.nullable(v.union([v.string()])),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["phone_number"]),
        phone_number: v.nullable(v.union([v.string()])),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["checkbox"]),
        checkbox: v.boolean(),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["files"]),
        files: v.pipe(v.array(v.lazy(() => InternalOrExternalFileWithNameResponse)), v.maxLength(100)),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["created_by"]),
        created_by: v.lazy(() => UserValueResponse),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["created_time"]),
        created_time: v.string(),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["last_edited_by"]),
        last_edited_by: v.lazy(() => UserValueResponse),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["last_edited_time"]),
        last_edited_time: v.string(),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["formula"]),
        formula: v.lazy(() => FormulaPropertyValueResponse),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["button"]),
        button: v.lazy(() => EmptyObject),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["unique_id"]),
        unique_id: v.lazy(() => UniqueIdPropertyValueResponse),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["verification"]),
        verification: v.nullable(v.union([v.lazy(() => VerificationPropertyValueResponse)])),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["place"]),
        place: v.nullable(v.union([v.lazy(() => PlacePropertyValueResponse)])),
      }),
    ]),
    v.union([
      v.looseObject({
        id: v.string(),
        type: v.picklist(["title"]),
        title: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["rich_text"]),
        rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["people"]),
        people: v.pipe(
          v.array(v.union([v.lazy(() => UserValueResponse), v.lazy(() => GroupObjectResponse)])),
          v.maxLength(100),
        ),
      }),
      v.looseObject({
        id: v.string(),
        type: v.picklist(["relation"]),
        relation: v.pipe(v.array(v.lazy(() => RelationItemPropertyValueResponse)), v.maxLength(100)),
      }),
    ]),
  ]),
  v.looseObject({
    id: v.string(),
    type: v.picklist(["rollup"]),
    rollup: v.lazy(() => PartialRollupValueResponse),
  }),
])

export const PageReferenceResponse: v.GenericSchema<unknown, T.PageReferenceResponse> = v.looseObject({
  object: v.string(),
  id: v.lazy(() => IdResponse),
})

export const PageTranscriptionBlockTranscriptDeletedWebhookPayload: v.GenericSchema<
  unknown,
  T.PageTranscriptionBlockTranscriptDeletedWebhookPayload
> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["page.transcription_block.transcript_deleted"]),
  entity: v.lazy(() => WebhookPageEntity),
  data: v.looseObject({
    target: v.lazy(() => WebhookExternalBlock),
    transcript_id: v.nullable(v.union([v.string()])),
  }),
})

export const PageUndeletedWebhookPayload: v.GenericSchema<unknown, T.PageUndeletedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["page.undeleted"]),
  entity: v.lazy(() => WebhookPageEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const PageUnlockedWebhookPayload: v.GenericSchema<unknown, T.PageUnlockedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["page.unlocked"]),
  entity: v.lazy(() => WebhookPageEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const PageWriteNotificationsSchema: v.GenericSchema<unknown, T.PageWriteNotificationsSchema> = v.looseObject({
  mode: v.picklist(["default", "silent"]),
})

export const ParagraphBlockObjectResponse: v.GenericSchema<unknown, T.ParagraphBlockObjectResponse> = v.looseObject({
  type: v.picklist(["paragraph"]),
  paragraph: v.lazy(() => ContentWithRichTextColorAndIconResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const ParagraphWithSingleLevelOfChildrenRequest: v.GenericSchema<
  unknown,
  T.ParagraphWithSingleLevelOfChildrenRequest
> = v.looseObject({
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
  color: v.optional(v.lazy(() => ApiColor)),
  icon: v.optional(v.lazy(() => PageIconRequest)),
  children: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequestWithoutChildren)), v.maxLength(100))),
})

export const ParentForBlockBasedObjectResponse: v.GenericSchema<unknown, T.ParentForBlockBasedObjectResponse> = v.union(
  [
    v.lazy(() => DatabaseParentResponse),
    v.lazy(() => DataSourceParentResponse),
    v.lazy(() => PageIdParentForBlockBasedObjectResponse),
    v.lazy(() => BlockIdParentForBlockBasedObjectResponse),
    v.lazy(() => AgentIdParentForBlockBasedObjectResponse),
    v.lazy(() => WorkspaceParentForBlockBasedObjectResponse),
  ],
)

export const ParentOfDataSourceRequest: v.GenericSchema<unknown, T.ParentOfDataSourceRequest> = v.looseObject({
  type: v.optional(v.picklist(["database_id"])),
  database_id: v.lazy(() => IdRequest),
})

export const ParentOfDataSourceResponse: v.GenericSchema<unknown, T.ParentOfDataSourceResponse> = v.union([
  v.lazy(() => DatabaseParentResponse),
  v.lazy(() => DataSourceParentResponse),
])

export const ParentOfDatabaseResponse: v.GenericSchema<unknown, T.ParentOfDatabaseResponse> = v.union([
  v.lazy(() => PageIdParentForBlockBasedObjectResponse),
  v.lazy(() => WorkspaceParentForBlockBasedObjectResponse),
  v.lazy(() => DatabaseParentResponse),
  v.lazy(() => BlockIdParentForBlockBasedObjectResponse),
])

export const PartialBlockObjectResponse: v.GenericSchema<unknown, T.PartialBlockObjectResponse> = v.looseObject({
  object: v.picklist(["block"]),
  id: v.string(),
})

export const PartialCommentObjectResponse: v.GenericSchema<unknown, T.PartialCommentObjectResponse> = v.looseObject({
  object: v.picklist(["comment"]),
  id: v.lazy(() => IdResponse),
})

export const PartialDataSourceObjectResponse: v.GenericSchema<unknown, T.PartialDataSourceObjectResponse> =
  v.looseObject({
    object: v.picklist(["data_source"]),
    id: v.lazy(() => IdResponse),
    properties: v.record(
      v.string(),
      v.lazy(() => DatabasePropertyConfigResponse),
    ),
  })

export const PartialDataSourceViewObjectResponse: v.GenericSchema<unknown, T.PartialDataSourceViewObjectResponse> =
  v.looseObject({
    object: v.picklist(["view"]),
    id: v.lazy(() => IdResponse),
    parent: v.lazy(() => DatabaseParentResponse),
    type: v.picklist([
      "table",
      "board",
      "list",
      "calendar",
      "timeline",
      "gallery",
      "form",
      "chart",
      "map",
      "dashboard",
    ]),
  })

export const PartialDatabaseObjectResponse: v.GenericSchema<unknown, T.PartialDatabaseObjectResponse> = v.looseObject({
  object: v.picklist(["database"]),
  id: v.lazy(() => IdResponse),
})

export const PartialPageObjectResponse: v.GenericSchema<unknown, T.PartialPageObjectResponse> = v.looseObject({
  object: v.picklist(["page"]),
  id: v.lazy(() => IdResponse),
})

export const PartialRollupPropertyResponse: v.GenericSchema<unknown, T.PartialRollupPropertyResponse> = v.looseObject({
  type: v.picklist(["rollup"]),
  rollup: v.lazy(() => PartialRollupValueResponse),
})

export const PartialRollupValueResponse: v.GenericSchema<unknown, T.PartialRollupValueResponse> = v.union([
  v.looseObject({
    function: v.lazy(() => RollupFunction),
    type: v.picklist(["number"]),
    number: v.nullable(v.union([number()])),
  }),
  v.looseObject({
    function: v.lazy(() => RollupFunction),
    type: v.picklist(["date"]),
    date: v.nullable(v.union([v.lazy(() => DateResponse)])),
  }),
  v.looseObject({
    function: v.lazy(() => RollupFunction),
    type: v.picklist(["array"]),
    array: v.pipe(v.array(v.lazy(() => SimpleOrArrayPropertyValueResponse)), v.maxLength(100)),
  }),
  v.looseObject({
    function: v.lazy(() => RollupFunction),
    type: v.picklist(["unsupported"]),
    unsupported: v.lazy(() => EmptyObject),
  }),
])

export const PartialRollupValueResponseCommon: v.GenericSchema<unknown, T.PartialRollupValueResponseCommon> =
  v.looseObject({
    function: v.lazy(() => RollupFunction),
  })

export const PartialSelectPropertyValueResponse: v.GenericSchema<unknown, T.PartialSelectPropertyValueResponse> =
  v.looseObject({
    id: v.string(),
    name: v.string(),
    color: v.picklist(["default", "gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"]),
  })

export const PartialSelectResponse: v.GenericSchema<unknown, T.PartialSelectResponse> = v.looseObject({
  id: v.string(),
  name: v.string(),
  color: v.lazy(() => SelectColor),
})

export const PartialUserObjectRequest: v.GenericSchema<unknown, T.PartialUserObjectRequest> = v.looseObject({
  id: v.lazy(() => IdRequest),
  object: v.optional(v.picklist(["user"])),
})

export const PartialUserObjectResponse: v.GenericSchema<unknown, T.PartialUserObjectResponse> = v.looseObject({
  id: v.lazy(() => IdResponse),
  object: v.picklist(["user"]),
})

export const PdfBlockObjectResponse: v.GenericSchema<unknown, T.PdfBlockObjectResponse> = v.looseObject({
  type: v.picklist(["pdf"]),
  pdf: v.lazy(() => MediaContentWithFileAndCaptionResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const PeopleArrayBasedPropertyValueResponse: v.GenericSchema<unknown, T.PeopleArrayBasedPropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["people"]),
    people: v.pipe(
      v.array(v.union([v.lazy(() => UserValueResponse), v.lazy(() => GroupObjectResponse)])),
      v.maxLength(100),
    ),
  })

export const PeopleDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.PeopleDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["people"]),
    people: v.lazy(() => EmptyObject),
  })

export const PeoplePropertyConfigurationRequest: v.GenericSchema<unknown, T.PeoplePropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["people"])),
    people: v.lazy(() => EmptyObject),
  })

export const PeoplePropertyFilter: v.GenericSchema<unknown, T.PeoplePropertyFilter> = v.union([
  v.union([
    v.looseObject({
      contains: v.lazy(() => PersonIdOrMe),
    }),
    v.looseObject({
      does_not_contain: v.lazy(() => PersonIdOrMe),
    }),
  ]),
  v.lazy(() => ExistencePropertyFilter),
])

export const PeoplePropertyItemObjectResponse: v.GenericSchema<unknown, T.PeoplePropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["people"]),
    people: v.union([v.lazy(() => PartialUserObjectResponse), v.lazy(() => UserObjectResponse)]),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const PersonGroupByConfigRequest: v.GenericSchema<unknown, T.PersonGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["person", "created_by", "last_edited_by"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortRequest),
  hide_empty_groups: v.optional(v.boolean()),
})

export const PersonGroupByConfigResponse: v.GenericSchema<unknown, T.PersonGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["person", "created_by", "last_edited_by"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
})

export const PersonIdOrMe: v.GenericSchema<unknown, T.PersonIdOrMe> = v.union([
  v.lazy(() => IdRequest),
  v.picklist(["me"]),
])

export const PersonUserObjectResponse: v.GenericSchema<unknown, T.PersonUserObjectResponse> = v.looseObject({
  type: v.picklist(["person"]),
  person: v.looseObject({
    email: v.optional(v.string()),
    email_verified: v.optional(v.boolean()),
  }),
})

export const PhoneNumberDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.PhoneNumberDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["phone_number"]),
  phone_number: v.lazy(() => EmptyObject),
})

export const PhoneNumberPropertyConfigurationRequest: v.GenericSchema<
  unknown,
  T.PhoneNumberPropertyConfigurationRequest
> = v.looseObject({
  type: v.optional(v.picklist(["phone_number"])),
  phone_number: v.lazy(() => EmptyObject),
})

export const PhoneNumberPropertyItemObjectResponse: v.GenericSchema<unknown, T.PhoneNumberPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["phone_number"]),
    phone_number: v.nullable(v.string()),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const PhoneNumberSimplePropertyValueResponse: v.GenericSchema<
  unknown,
  T.PhoneNumberSimplePropertyValueResponse
> = v.looseObject({
  type: v.picklist(["phone_number"]),
  phone_number: v.nullable(v.union([v.string()])),
})

export const PlacePropertyConfigurationRequest: v.GenericSchema<unknown, T.PlacePropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["place"])),
    place: v.lazy(() => EmptyObject),
  })

export const PlacePropertyItemObjectResponse: v.GenericSchema<unknown, T.PlacePropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["place"]),
    place: v.nullable(
      v.looseObject({
        lat: number(),
        lon: number(),
        name: v.optional(v.nullable(v.string())),
        address: v.optional(v.nullable(v.string())),
        aws_place_id: v.optional(v.nullable(v.string())),
        google_place_id: v.optional(v.nullable(v.string())),
      }),
    ),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const PlacePropertyValueResponse: v.GenericSchema<unknown, T.PlacePropertyValueResponse> = v.looseObject({
  lat: number(),
  lon: number(),
  name: v.optional(v.nullable(v.union([v.string()]))),
  address: v.optional(v.nullable(v.union([v.string()]))),
  aws_place_id: v.optional(v.nullable(v.union([v.string()]))),
  google_place_id: v.optional(v.nullable(v.union([v.string()]))),
})

export const PlaceSimplePropertyValueResponse: v.GenericSchema<unknown, T.PlaceSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["place"]),
    place: v.nullable(v.union([v.lazy(() => PlacePropertyValueResponse)])),
  })

export const PropertyConfigurationRequest: v.GenericSchema<unknown, T.PropertyConfigurationRequest> = v.union([
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["number"])),
    number: v.looseObject({
      format: v.optional(v.lazy(() => NumberFormat)),
    }),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["formula"])),
    formula: v.looseObject({
      expression: v.optional(v.string()),
    }),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["select"])),
    select: v.looseObject({
      options: v.optional(
        v.pipe(
          v.array(
            v.looseObject({
              name: v.string(),
              color: v.optional(v.lazy(() => SelectColor)),
              description: v.optional(v.nullable(v.union([v.string()]))),
            }),
          ),
          v.maxLength(100),
        ),
      ),
    }),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["multi_select"])),
    multi_select: v.looseObject({
      options: v.optional(
        v.pipe(
          v.array(
            v.looseObject({
              name: v.string(),
              color: v.optional(v.lazy(() => SelectColor)),
              description: v.optional(v.nullable(v.union([v.string()]))),
            }),
          ),
          v.maxLength(100),
        ),
      ),
    }),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["status"])),
    status: v.lazy(() => StatusPropertyConfigRequest),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["relation"])),
    relation: v.union([
      v.looseObject({
        data_source_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["single_property"])),
        single_property: v.lazy(() => EmptyObject),
      }),
      v.looseObject({
        data_source_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["dual_property"])),
        dual_property: v.looseObject({
          synced_property_id: v.optional(v.string()),
          synced_property_name: v.optional(v.string()),
        }),
      }),
    ]),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["rollup"])),
    rollup: v.union([
      v.looseObject({
        function: v.lazy(() => RollupFunction),
        relation_property_name: v.string(),
        rollup_property_name: v.string(),
      }),
      v.looseObject({
        function: v.lazy(() => RollupFunction),
        relation_property_id: v.string(),
        rollup_property_name: v.string(),
      }),
      v.looseObject({
        function: v.lazy(() => RollupFunction),
        relation_property_name: v.string(),
        rollup_property_id: v.string(),
      }),
      v.looseObject({
        function: v.lazy(() => RollupFunction),
        relation_property_id: v.string(),
        rollup_property_id: v.string(),
      }),
    ]),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["unique_id"])),
    unique_id: v.looseObject({
      prefix: v.optional(v.nullable(v.union([v.string()]))),
    }),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["title"])),
    title: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["rich_text"])),
    rich_text: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["url"])),
    url: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["people"])),
    people: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["files"])),
    files: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["email"])),
    email: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["phone_number"])),
    phone_number: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["date"])),
    date: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["checkbox"])),
    checkbox: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["created_by"])),
    created_by: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["created_time"])),
    created_time: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["last_edited_by"])),
    last_edited_by: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["last_edited_time"])),
    last_edited_time: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["button"])),
    button: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["location"])),
    location: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["verification"])),
    verification: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["last_visited_time"])),
    last_visited_time: v.lazy(() => EmptyObject),
  }),
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
    type: v.optional(v.picklist(["place"])),
    place: v.lazy(() => EmptyObject),
  }),
])

export const PropertyConfigurationRequestCommon: v.GenericSchema<unknown, T.PropertyConfigurationRequestCommon> =
  v.looseObject({
    description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
  })

export const PropertyDescriptionRequest: v.GenericSchema<unknown, T.PropertyDescriptionRequest> = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(280),
)

export const PropertyFilter: v.GenericSchema<unknown, T.PropertyFilter> = v.union([
  v.looseObject({
    title: v.lazy(() => TextPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["title"])),
  }),
  v.looseObject({
    rich_text: v.lazy(() => TextPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["rich_text"])),
  }),
  v.looseObject({
    number: v.lazy(() => NumberPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["number"])),
  }),
  v.looseObject({
    checkbox: v.lazy(() => CheckboxPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["checkbox"])),
  }),
  v.looseObject({
    select: v.lazy(() => SelectPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["select"])),
  }),
  v.looseObject({
    multi_select: v.lazy(() => MultiSelectPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["multi_select"])),
  }),
  v.looseObject({
    status: v.lazy(() => StatusPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["status"])),
  }),
  v.looseObject({
    date: v.lazy(() => DatePropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["date"])),
  }),
  v.looseObject({
    people: v.lazy(() => PeoplePropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["people"])),
  }),
  v.looseObject({
    files: v.lazy(() => ExistencePropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["files"])),
  }),
  v.looseObject({
    url: v.lazy(() => TextPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["url"])),
  }),
  v.looseObject({
    email: v.lazy(() => TextPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["email"])),
  }),
  v.looseObject({
    phone_number: v.lazy(() => TextPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["phone_number"])),
  }),
  v.looseObject({
    relation: v.lazy(() => RelationPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["relation"])),
  }),
  v.looseObject({
    created_by: v.lazy(() => PeoplePropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["created_by"])),
  }),
  v.looseObject({
    created_time: v.lazy(() => DatePropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["created_time"])),
  }),
  v.looseObject({
    last_edited_by: v.lazy(() => PeoplePropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["last_edited_by"])),
  }),
  v.looseObject({
    last_edited_time: v.lazy(() => DatePropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["last_edited_time"])),
  }),
  v.looseObject({
    formula: v.lazy(() => FormulaPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["formula"])),
  }),
  v.looseObject({
    unique_id: v.lazy(() => NumberPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["unique_id"])),
  }),
  v.looseObject({
    rollup: v.lazy(() => RollupPropertyFilter),
    property: v.string(),
    type: v.optional(v.picklist(["rollup"])),
  }),
  v.looseObject({
    verification: v.union([
      v.lazy(() => VerificationPropertyStatusFilter),
      v.lazy(() => VerificationPropertyDoesNotEqualFilter),
    ]),
    property: v.string(),
    type: v.optional(v.picklist(["verification"])),
  }),
])

export const PropertyItemListResponse: v.GenericSchema<unknown, T.PropertyItemListResponse> = v.lazy(
  () => PropertyItemPropertyItemListResponse,
)

export const PropertyItemObjectResponse: v.GenericSchema<unknown, T.PropertyItemObjectResponse> = v.union([
  v.lazy(() => NumberPropertyItemObjectResponse),
  v.lazy(() => UrlPropertyItemObjectResponse),
  v.lazy(() => SelectPropertyItemObjectResponse),
  v.lazy(() => MultiSelectPropertyItemObjectResponse),
  v.lazy(() => StatusPropertyItemObjectResponse),
  v.lazy(() => DatePropertyItemObjectResponse),
  v.lazy(() => EmailPropertyItemObjectResponse),
  v.lazy(() => PhoneNumberPropertyItemObjectResponse),
  v.lazy(() => CheckboxPropertyItemObjectResponse),
  v.lazy(() => FilesPropertyItemObjectResponse),
  v.lazy(() => CreatedByPropertyItemObjectResponse),
  v.lazy(() => CreatedTimePropertyItemObjectResponse),
  v.lazy(() => LastEditedByPropertyItemObjectResponse),
  v.lazy(() => LastEditedTimePropertyItemObjectResponse),
  v.lazy(() => FormulaPropertyItemObjectResponse),
  v.lazy(() => ButtonPropertyItemObjectResponse),
  v.lazy(() => UniqueIdPropertyItemObjectResponse),
  v.lazy(() => VerificationPropertyItemObjectResponse),
  v.lazy(() => PlacePropertyItemObjectResponse),
  v.lazy(() => TitlePropertyItemObjectResponse),
  v.lazy(() => RichTextPropertyItemObjectResponse),
  v.lazy(() => PeoplePropertyItemObjectResponse),
  v.lazy(() => RelationPropertyItemObjectResponse),
  v.lazy(() => RollupPropertyItemObjectResponse),
])

export const PropertyItemPropertyItemListResponse: v.GenericSchema<unknown, T.PropertyItemPropertyItemListResponse> =
  v.looseObject({
    type: v.picklist(["property_item"]),
    property_item: v.union([
      v.looseObject({
        type: v.picklist(["title"]),
        title: v.lazy(() => EmptyObject),
        next_url: v.nullable(v.string()),
        id: v.string(),
      }),
      v.looseObject({
        type: v.picklist(["rich_text"]),
        rich_text: v.lazy(() => EmptyObject),
        next_url: v.nullable(v.string()),
        id: v.string(),
      }),
      v.looseObject({
        type: v.picklist(["people"]),
        people: v.lazy(() => EmptyObject),
        next_url: v.nullable(v.string()),
        id: v.string(),
      }),
      v.looseObject({
        type: v.picklist(["relation"]),
        relation: v.lazy(() => EmptyObject),
        next_url: v.nullable(v.string()),
        id: v.string(),
      }),
      v.looseObject({
        type: v.picklist(["rollup"]),
        rollup: v.union([
          v.looseObject({
            type: v.picklist(["number"]),
            number: v.nullable(number()),
            function: v.lazy(() => RollupFunction),
          }),
          v.looseObject({
            type: v.picklist(["date"]),
            date: v.nullable(v.union([v.lazy(() => DateResponse)])),
            function: v.lazy(() => RollupFunction),
          }),
          v.looseObject({
            type: v.picklist(["array"]),
            array: v.pipe(v.array(v.lazy(() => EmptyObject)), v.maxLength(100)),
            function: v.lazy(() => RollupFunction),
          }),
          v.looseObject({
            type: v.picklist(["unsupported"]),
            unsupported: v.lazy(() => EmptyObject),
            function: v.lazy(() => RollupFunction),
          }),
          v.looseObject({
            type: v.picklist(["incomplete"]),
            incomplete: v.lazy(() => EmptyObject),
            function: v.lazy(() => RollupFunction),
          }),
        ]),
        next_url: v.nullable(v.string()),
        id: v.string(),
      }),
    ]),
    object: v.picklist(["list"]),
    next_cursor: v.nullable(v.string()),
    has_more: v.boolean(),
    results: v.array(v.lazy(() => PropertyItemObjectResponse)),
  })

export const PropertyOrTimestampFilter: v.GenericSchema<unknown, T.PropertyOrTimestampFilter> = v.union([
  v.lazy(() => PropertyFilter),
  v.lazy(() => TimestampFilter),
])

export const PropertyOrTimestampFilterArray: v.GenericSchema<unknown, T.PropertyOrTimestampFilterArray> = v.pipe(
  v.array(v.lazy(() => PropertyOrTimestampFilter)),
  v.maxLength(100),
)

export const PropertySortResponse: v.GenericSchema<unknown, T.PropertySortResponse> = v.looseObject({
  property: v.string(),
  direction: v.picklist(["ascending", "descending"]),
})

export const PublicApiAsyncTaskStatusResultJsonValue: v.GenericSchema<
  unknown,
  T.PublicApiAsyncTaskStatusResultJsonValue
> = v.unknown()

export const PublicApiCommonErrorResponse: v.GenericSchema<unknown, T.PublicApiCommonErrorResponse> = v.looseObject({
  object: v.picklist(["error"]),
  message: v.string(),
  additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
})

export const QuickFilterConditionRequest: v.GenericSchema<unknown, T.QuickFilterConditionRequest> = v.union([
  v.lazy(() => EmptyObject),
  v.union([
    v.looseObject({
      title: v.lazy(() => TextPropertyFilter),
      type: v.optional(v.picklist(["title"])),
    }),
    v.looseObject({
      rich_text: v.lazy(() => TextPropertyFilter),
      type: v.optional(v.picklist(["rich_text"])),
    }),
    v.looseObject({
      number: v.lazy(() => NumberPropertyFilter),
      type: v.optional(v.picklist(["number"])),
    }),
    v.looseObject({
      checkbox: v.lazy(() => CheckboxPropertyFilter),
      type: v.optional(v.picklist(["checkbox"])),
    }),
    v.looseObject({
      select: v.lazy(() => SelectPropertyFilter),
      type: v.optional(v.picklist(["select"])),
    }),
    v.looseObject({
      multi_select: v.lazy(() => MultiSelectPropertyFilter),
      type: v.optional(v.picklist(["multi_select"])),
    }),
    v.looseObject({
      status: v.lazy(() => StatusPropertyFilter),
      type: v.optional(v.picklist(["status"])),
    }),
    v.looseObject({
      date: v.lazy(() => DatePropertyFilter),
      type: v.optional(v.picklist(["date"])),
    }),
    v.looseObject({
      people: v.lazy(() => PeoplePropertyFilter),
      type: v.optional(v.picklist(["people"])),
    }),
    v.looseObject({
      files: v.lazy(() => ExistencePropertyFilter),
      type: v.optional(v.picklist(["files"])),
    }),
    v.looseObject({
      url: v.lazy(() => TextPropertyFilter),
      type: v.optional(v.picklist(["url"])),
    }),
    v.looseObject({
      email: v.lazy(() => TextPropertyFilter),
      type: v.optional(v.picklist(["email"])),
    }),
    v.looseObject({
      phone_number: v.lazy(() => TextPropertyFilter),
      type: v.optional(v.picklist(["phone_number"])),
    }),
    v.looseObject({
      relation: v.lazy(() => RelationPropertyFilter),
      type: v.optional(v.picklist(["relation"])),
    }),
    v.looseObject({
      created_by: v.lazy(() => PeoplePropertyFilter),
      type: v.optional(v.picklist(["created_by"])),
    }),
    v.looseObject({
      created_time: v.lazy(() => DatePropertyFilter),
      type: v.optional(v.picklist(["created_time"])),
    }),
    v.looseObject({
      last_edited_by: v.lazy(() => PeoplePropertyFilter),
      type: v.optional(v.picklist(["last_edited_by"])),
    }),
    v.looseObject({
      last_edited_time: v.lazy(() => DatePropertyFilter),
      type: v.optional(v.picklist(["last_edited_time"])),
    }),
    v.looseObject({
      formula: v.lazy(() => FormulaPropertyFilter),
      type: v.optional(v.picklist(["formula"])),
    }),
    v.looseObject({
      unique_id: v.lazy(() => NumberPropertyFilter),
      type: v.optional(v.picklist(["unique_id"])),
    }),
    v.looseObject({
      rollup: v.lazy(() => RollupPropertyFilter),
      type: v.optional(v.picklist(["rollup"])),
    }),
    v.looseObject({
      verification: v.union([
        v.lazy(() => VerificationPropertyStatusFilter),
        v.lazy(() => VerificationPropertyDoesNotEqualFilter),
      ]),
      type: v.optional(v.picklist(["verification"])),
    }),
  ]),
])

export const QuickFilterConditionResponse: v.GenericSchema<unknown, T.QuickFilterConditionResponse> = v.looseObject({})

export const QuoteBlockObjectResponse: v.GenericSchema<unknown, T.QuoteBlockObjectResponse> = v.looseObject({
  type: v.picklist(["quote"]),
  quote: v.lazy(() => ContentWithRichTextAndColorResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const RelationArrayBasedPropertyValueResponse: v.GenericSchema<
  unknown,
  T.RelationArrayBasedPropertyValueResponse
> = v.looseObject({
  type: v.picklist(["relation"]),
  relation: v.pipe(v.array(v.lazy(() => RelationItemPropertyValueResponse)), v.maxLength(100)),
})

export const RelationDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.RelationDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["relation"]),
  relation: v.lazy(() => DatabasePropertyRelationConfigResponse),
})

export const RelationGroupByConfigRequest: v.GenericSchema<unknown, T.RelationGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["relation"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortRequest),
  hide_empty_groups: v.optional(v.boolean()),
})

export const RelationGroupByConfigResponse: v.GenericSchema<unknown, T.RelationGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["relation"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
})

export const RelationItemPropertyValueResponse: v.GenericSchema<unknown, T.RelationItemPropertyValueResponse> =
  v.looseObject({
    id: v.lazy(() => IdRequest),
  })

export const RelationPropertyConfigurationRequest: v.GenericSchema<unknown, T.RelationPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["relation"])),
    relation: v.union([
      v.looseObject({
        data_source_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["single_property"])),
        single_property: v.lazy(() => EmptyObject),
      }),
      v.looseObject({
        data_source_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["dual_property"])),
        dual_property: v.looseObject({
          synced_property_id: v.optional(v.string()),
          synced_property_name: v.optional(v.string()),
        }),
      }),
    ]),
  })

export const RelationPropertyFilter: v.GenericSchema<unknown, T.RelationPropertyFilter> = v.union([
  v.union([
    v.looseObject({
      contains: v.lazy(() => IdRequest),
    }),
    v.looseObject({
      does_not_contain: v.lazy(() => IdRequest),
    }),
  ]),
  v.lazy(() => ExistencePropertyFilter),
])

export const RelationPropertyItemObjectResponse: v.GenericSchema<unknown, T.RelationPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["relation"]),
    relation: v.looseObject({
      id: v.string(),
    }),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const RelativeDateValue: v.GenericSchema<unknown, T.RelativeDateValue> = v.picklist([
  "today",
  "tomorrow",
  "yesterday",
  "one_week_ago",
  "one_week_from_now",
  "one_month_ago",
  "one_month_from_now",
])

export const RequestStatusResponse: v.GenericSchema<unknown, T.RequestStatusResponse> = v.looseObject({
  type: v.picklist(["complete", "incomplete"]),
  incomplete_reason: v.optional(v.picklist(["query_result_limit_reached"])),
})

export const RichTextArrayBasedPropertyValueResponse: v.GenericSchema<
  unknown,
  T.RichTextArrayBasedPropertyValueResponse
> = v.looseObject({
  type: v.picklist(["rich_text"]),
  rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
})

export const RichTextDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.RichTextDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["rich_text"]),
  rich_text: v.lazy(() => EmptyObject),
})

export const RichTextItemRequest: v.GenericSchema<unknown, T.RichTextItemRequest> = v.union([
  v.looseObject({
    annotations: v.optional(v.lazy(() => AnnotationRequest)),
    type: v.optional(v.picklist(["text"])),
    text: v.looseObject({
      content: v.pipe(v.string(), v.maxLength(2000)),
      link: v.optional(
        v.nullable(
          v.union([
            v.looseObject({
              url: v.string(),
            }),
          ]),
        ),
      ),
    }),
  }),
  v.looseObject({
    annotations: v.optional(v.lazy(() => AnnotationRequest)),
    type: v.optional(v.picklist(["mention"])),
    mention: v.union([
      v.looseObject({
        type: v.optional(v.picklist(["user"])),
        user: v.lazy(() => PartialUserObjectRequest),
      }),
      v.looseObject({
        type: v.optional(v.picklist(["date"])),
        date: v.lazy(() => DateRequest),
      }),
      v.looseObject({
        type: v.optional(v.picklist(["page"])),
        page: v.looseObject({
          id: v.lazy(() => IdRequest),
        }),
      }),
      v.looseObject({
        type: v.optional(v.picklist(["database"])),
        database: v.looseObject({
          id: v.lazy(() => IdRequest),
        }),
      }),
      v.looseObject({
        type: v.optional(v.picklist(["template_mention"])),
        template_mention: v.lazy(() => TemplateMentionRequest),
      }),
      v.looseObject({
        type: v.optional(v.picklist(["custom_emoji"])),
        custom_emoji: v.looseObject({
          id: v.lazy(() => IdRequest),
          name: v.optional(v.string()),
          url: v.optional(v.string()),
        }),
      }),
    ]),
  }),
  v.looseObject({
    annotations: v.optional(v.lazy(() => AnnotationRequest)),
    type: v.optional(v.picklist(["equation"])),
    equation: v.looseObject({
      expression: v.string(),
    }),
  }),
])

export const RichTextItemRequestCommon: v.GenericSchema<unknown, T.RichTextItemRequestCommon> = v.looseObject({
  annotations: v.optional(v.lazy(() => AnnotationRequest)),
})

export const RichTextItemResponse: v.GenericSchema<unknown, T.RichTextItemResponse> = v.union([
  v.looseObject({
    plain_text: v.string(),
    href: v.nullable(v.union([v.string()])),
    annotations: v.lazy(() => AnnotationResponse),
    type: v.picklist(["text"]),
    text: v.looseObject({
      content: v.pipe(v.string(), v.maxLength(2000)),
      link: v.nullable(
        v.union([
          v.looseObject({
            url: v.string(),
          }),
        ]),
      ),
    }),
  }),
  v.looseObject({
    plain_text: v.string(),
    href: v.nullable(v.union([v.string()])),
    annotations: v.lazy(() => AnnotationResponse),
    type: v.picklist(["mention"]),
    mention: v.union([
      v.looseObject({
        type: v.picklist(["user"]),
        user: v.lazy(() => UserValueResponse),
      }),
      v.looseObject({
        type: v.picklist(["date"]),
        date: v.lazy(() => DateResponse),
      }),
      v.looseObject({
        type: v.picklist(["link_preview"]),
        link_preview: v.lazy(() => LinkPreviewMentionResponse),
      }),
      v.looseObject({
        type: v.picklist(["link_mention"]),
        link_mention: v.lazy(() => LinkMentionResponse),
      }),
      v.looseObject({
        type: v.picklist(["page"]),
        page: v.looseObject({
          id: v.lazy(() => IdResponse),
        }),
      }),
      v.looseObject({
        type: v.picklist(["database"]),
        database: v.looseObject({
          id: v.lazy(() => IdResponse),
        }),
      }),
      v.looseObject({
        type: v.picklist(["template_mention"]),
        template_mention: v.lazy(() => TemplateMentionResponse),
      }),
      v.looseObject({
        type: v.picklist(["custom_emoji"]),
        custom_emoji: v.lazy(() => CustomEmojiResponse),
      }),
    ]),
  }),
  v.looseObject({
    plain_text: v.string(),
    href: v.nullable(v.union([v.string()])),
    annotations: v.lazy(() => AnnotationResponse),
    type: v.picklist(["equation"]),
    equation: v.looseObject({
      expression: v.string(),
    }),
  }),
])

export const RichTextItemResponseCommon: v.GenericSchema<unknown, T.RichTextItemResponseCommon> = v.looseObject({
  plain_text: v.string(),
  href: v.nullable(v.union([v.string()])),
  annotations: v.lazy(() => AnnotationResponse),
})

export const RichTextPropertyConfigurationRequest: v.GenericSchema<unknown, T.RichTextPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["rich_text"])),
    rich_text: v.lazy(() => EmptyObject),
  })

export const RichTextPropertyItemObjectResponse: v.GenericSchema<unknown, T.RichTextPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["rich_text"]),
    rich_text: v.lazy(() => RichTextItemResponse),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const RollupDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.RollupDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["rollup"]),
    rollup: v.looseObject({
      function: v.lazy(() => RollupFunction),
      rollup_property_name: v.string(),
      relation_property_name: v.string(),
      rollup_property_id: v.string(),
      relation_property_id: v.string(),
    }),
  })

export const RollupFunction: v.GenericSchema<unknown, T.RollupFunction> = v.picklist([
  "count",
  "count_values",
  "empty",
  "not_empty",
  "unique",
  "show_unique",
  "percent_empty",
  "percent_not_empty",
  "sum",
  "average",
  "median",
  "min",
  "max",
  "range",
  "earliest_date",
  "latest_date",
  "date_range",
  "checked",
  "unchecked",
  "percent_checked",
  "percent_unchecked",
  "count_per_group",
  "percent_per_group",
  "show_original",
])

export const RollupPropertyConfigurationRequest: v.GenericSchema<unknown, T.RollupPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["rollup"])),
    rollup: v.union([
      v.looseObject({
        function: v.lazy(() => RollupFunction),
        relation_property_name: v.string(),
        rollup_property_name: v.string(),
      }),
      v.looseObject({
        function: v.lazy(() => RollupFunction),
        relation_property_id: v.string(),
        rollup_property_name: v.string(),
      }),
      v.looseObject({
        function: v.lazy(() => RollupFunction),
        relation_property_name: v.string(),
        rollup_property_id: v.string(),
      }),
      v.looseObject({
        function: v.lazy(() => RollupFunction),
        relation_property_id: v.string(),
        rollup_property_id: v.string(),
      }),
    ]),
  })

export const RollupPropertyFilter: v.GenericSchema<unknown, T.RollupPropertyFilter> = v.union([
  v.looseObject({
    any: v.lazy(() => RollupSubfilterPropertyFilter),
  }),
  v.looseObject({
    none: v.lazy(() => RollupSubfilterPropertyFilter),
  }),
  v.looseObject({
    every: v.lazy(() => RollupSubfilterPropertyFilter),
  }),
  v.looseObject({
    date: v.lazy(() => DatePropertyFilter),
  }),
  v.looseObject({
    number: v.lazy(() => NumberPropertyFilter),
  }),
])

export const RollupPropertyItemObjectResponse: v.GenericSchema<unknown, T.RollupPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["rollup"]),
    rollup: v.union([
      v.looseObject({
        type: v.picklist(["number"]),
        number: v.nullable(number()),
        function: v.lazy(() => RollupFunction),
      }),
      v.looseObject({
        type: v.picklist(["date"]),
        date: v.nullable(v.union([v.lazy(() => DateResponse)])),
        function: v.lazy(() => RollupFunction),
      }),
      v.looseObject({
        type: v.picklist(["array"]),
        array: v.pipe(v.array(v.lazy(() => EmptyObject)), v.maxLength(100)),
        function: v.lazy(() => RollupFunction),
      }),
      v.looseObject({
        type: v.picklist(["unsupported"]),
        unsupported: v.lazy(() => EmptyObject),
        function: v.lazy(() => RollupFunction),
      }),
      v.looseObject({
        type: v.picklist(["incomplete"]),
        incomplete: v.lazy(() => EmptyObject),
        function: v.lazy(() => RollupFunction),
      }),
    ]),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const RollupSubfilterPropertyFilter: v.GenericSchema<unknown, T.RollupSubfilterPropertyFilter> = v.union([
  v.looseObject({
    rich_text: v.lazy(() => TextPropertyFilter),
  }),
  v.looseObject({
    number: v.lazy(() => NumberPropertyFilter),
  }),
  v.looseObject({
    checkbox: v.lazy(() => CheckboxPropertyFilter),
  }),
  v.looseObject({
    select: v.lazy(() => SelectPropertyFilter),
  }),
  v.looseObject({
    multi_select: v.lazy(() => MultiSelectPropertyFilter),
  }),
  v.looseObject({
    relation: v.lazy(() => RelationPropertyFilter),
  }),
  v.looseObject({
    date: v.lazy(() => DatePropertyFilter),
  }),
  v.looseObject({
    people: v.lazy(() => PeoplePropertyFilter),
  }),
  v.looseObject({
    files: v.lazy(() => ExistencePropertyFilter),
  }),
  v.looseObject({
    status: v.lazy(() => StatusPropertyFilter),
  }),
])

export const SelectColor: v.GenericSchema<unknown, T.SelectColor> = v.picklist([
  "default",
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
])

export const SelectDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.SelectDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["select"]),
    select: v.looseObject({
      options: v.pipe(v.array(v.lazy(() => SelectPropertyResponse)), v.maxLength(100)),
    }),
  })

export const SelectGroupByConfigRequest: v.GenericSchema<unknown, T.SelectGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["select", "multi_select"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortRequest),
  hide_empty_groups: v.optional(v.boolean()),
})

export const SelectGroupByConfigResponse: v.GenericSchema<unknown, T.SelectGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["select", "multi_select"]),
  property_id: v.string(),
  sort: v.lazy(() => GroupSortResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
})

export const SelectPropertyConfigurationRequest: v.GenericSchema<unknown, T.SelectPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["select"])),
    select: v.looseObject({
      options: v.optional(
        v.pipe(
          v.array(
            v.looseObject({
              name: v.string(),
              color: v.optional(v.lazy(() => SelectColor)),
              description: v.optional(v.nullable(v.union([v.string()]))),
            }),
          ),
          v.maxLength(100),
        ),
      ),
    }),
  })

export const SelectPropertyFilter: v.GenericSchema<unknown, T.SelectPropertyFilter> = v.union([
  v.union([
    v.looseObject({
      equals: v.lazy(() => StringOrStringArray),
    }),
    v.looseObject({
      does_not_equal: v.lazy(() => StringOrStringArray),
    }),
  ]),
  v.lazy(() => ExistencePropertyFilter),
])

export const SelectPropertyItemObjectResponse: v.GenericSchema<unknown, T.SelectPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["select"]),
    select: v.nullable(v.union([v.lazy(() => PartialSelectResponse)])),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const SelectPropertyResponse: v.GenericSchema<unknown, T.SelectPropertyResponse> = v.looseObject({
  id: v.string(),
  name: v.string(),
  color: v.lazy(() => SelectColor),
  description: v.nullable(v.union([v.string()])),
})

export const SelectSimplePropertyValueResponse: v.GenericSchema<unknown, T.SelectSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["select"]),
    select: v.nullable(v.union([v.lazy(() => PartialSelectPropertyValueResponse)])),
  })

export const SessionAgentIdFilter: v.GenericSchema<unknown, T.SessionAgentIdFilter> = v.looseObject({
  property: v.picklist(["agent_id"]),
  string: v.looseObject({
    equals: v.string(),
  }),
})

export const SessionIdFilter: v.GenericSchema<unknown, T.SessionIdFilter> = v.looseObject({
  property: v.picklist(["id"]),
  string: v.looseObject({
    equals: v.string(),
  }),
})

export const SessionNestedFilter: v.GenericSchema<unknown, T.SessionNestedFilter> = v.union([
  v.lazy(() => SessionIdFilter),
  v.lazy(() => SessionAgentIdFilter),
  v.lazy(() => SessionStatusFilter),
  v.lazy(() => SessionTimestampFilter),
  v.looseObject({
    and: v.pipe(
      v.array(
        v.union([
          v.lazy(() => SessionIdFilter),
          v.lazy(() => SessionAgentIdFilter),
          v.lazy(() => SessionStatusFilter),
          v.lazy(() => SessionTimestampFilter),
        ]),
      ),
      v.maxLength(100),
    ),
  }),
  v.looseObject({
    or: v.pipe(
      v.array(
        v.union([
          v.lazy(() => SessionIdFilter),
          v.lazy(() => SessionAgentIdFilter),
          v.lazy(() => SessionStatusFilter),
          v.lazy(() => SessionTimestampFilter),
        ]),
      ),
      v.maxLength(100),
    ),
  }),
])

export const SessionStatusFilter: v.GenericSchema<unknown, T.SessionStatusFilter> = v.looseObject({
  property: v.picklist(["status"]),
  status: v.looseObject({
    equals: v.optional(
      v.picklist(["queued", "in_progress", "requires_action", "completed", "failed", "canceled", "terminated"]),
    ),
    in: v.optional(
      v.pipe(
        v.array(
          v.picklist(["queued", "in_progress", "requires_action", "completed", "failed", "canceled", "terminated"]),
        ),
        v.maxLength(7),
      ),
    ),
  }),
})

export const SessionTimestampFilter: v.GenericSchema<unknown, T.SessionTimestampFilter> = v.looseObject({
  property: v.picklist(["created_at", "updated_at"]),
  timestamp: v.looseObject({
    before: v.optional(v.string()),
    after: v.optional(v.string()),
    on_or_before: v.optional(v.string()),
    on_or_after: v.optional(v.string()),
  }),
})

export const SimpleOrArrayPropertyValueResponse: v.GenericSchema<unknown, T.SimpleOrArrayPropertyValueResponse> =
  v.union([v.lazy(() => SimplePropertyValueResponse), v.lazy(() => ArrayBasedPropertyValueResponse)])

export const SimplePropertyValueResponse: v.GenericSchema<unknown, T.SimplePropertyValueResponse> = v.union([
  v.lazy(() => NumberSimplePropertyValueResponse),
  v.lazy(() => UrlSimplePropertyValueResponse),
  v.lazy(() => SelectSimplePropertyValueResponse),
  v.lazy(() => MultiSelectSimplePropertyValueResponse),
  v.lazy(() => StatusSimplePropertyValueResponse),
  v.lazy(() => DateSimplePropertyValueResponse),
  v.lazy(() => EmailSimplePropertyValueResponse),
  v.lazy(() => PhoneNumberSimplePropertyValueResponse),
  v.lazy(() => CheckboxSimplePropertyValueResponse),
  v.lazy(() => FilesSimplePropertyValueResponse),
  v.lazy(() => CreatedBySimplePropertyValueResponse),
  v.lazy(() => CreatedTimeSimplePropertyValueResponse),
  v.lazy(() => LastEditedBySimplePropertyValueResponse),
  v.lazy(() => LastEditedTimeSimplePropertyValueResponse),
  v.lazy(() => FormulaSimplePropertyValueResponse),
  v.lazy(() => ButtonSimplePropertyValueResponse),
  v.lazy(() => UniqueIdSimplePropertyValueResponse),
  v.lazy(() => VerificationSimplePropertyValueResponse),
  v.lazy(() => PlaceSimplePropertyValueResponse),
])

export const SinglePropertyDatabasePropertyRelationConfigResponse: v.GenericSchema<
  unknown,
  T.SinglePropertyDatabasePropertyRelationConfigResponse
> = v.looseObject({
  type: v.picklist(["single_property"]),
  single_property: v.lazy(() => EmptyObject),
})

export const SortDirectionRequest: v.GenericSchema<unknown, T.SortDirectionRequest> = v.picklist([
  "ascending",
  "descending",
])

export const StatusDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.StatusDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["status"]),
    status: v.looseObject({
      default_option: v.nullable(v.union([v.string()])),
      options: v.pipe(v.array(v.lazy(() => StatusPropertyResponse)), v.maxLength(100)),
      groups: v.pipe(
        v.array(
          v.looseObject({
            id: v.string(),
            name: v.string(),
            color: v.lazy(() => SelectColor),
            option_ids: v.pipe(v.array(v.string()), v.maxLength(100)),
          }),
        ),
        v.maxLength(100),
      ),
    }),
  })

export const StatusGroupByConfigRequest: v.GenericSchema<unknown, T.StatusGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["status"]),
  property_id: v.string(),
  group_by: v.picklist(["group", "option"]),
  sort: v.lazy(() => GroupSortRequest),
  hide_empty_groups: v.optional(v.boolean()),
})

export const StatusGroupByConfigResponse: v.GenericSchema<unknown, T.StatusGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["status"]),
  property_id: v.string(),
  group_by: v.picklist(["group", "option"]),
  sort: v.lazy(() => GroupSortResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
})

export const StatusGroupNames: v.GenericSchema<unknown, T.StatusGroupNames> = v.union([
  v.lazy(() => StringRequest),
  v.pipe(v.array(v.lazy(() => StringRequest)), v.minLength(1), v.maxLength(100)),
])

export const StatusOptionGroup: v.GenericSchema<unknown, T.StatusOptionGroup> = v.picklist([
  "To-do",
  "In progress",
  "Complete",
])

export const StatusOptionRequest: v.GenericSchema<unknown, T.StatusOptionRequest> = v.looseObject({
  name: v.string(),
  color: v.optional(v.lazy(() => SelectColor)),
  description: v.optional(v.nullable(v.union([v.string()]))),
  group: v.optional(v.lazy(() => StatusOptionGroup)),
})

export const StatusOptionRequestArray: v.GenericSchema<unknown, T.StatusOptionRequestArray> = v.pipe(
  v.array(v.lazy(() => StatusOptionRequest)),
  v.maxLength(100),
)

export const StatusOptionUpdateRequest: v.GenericSchema<unknown, T.StatusOptionUpdateRequest> = v.union([
  v.looseObject({
    color: v.optional(v.lazy(() => SelectColor)),
    description: v.optional(v.nullable(v.union([v.string()]))),
    group: v.optional(v.lazy(() => StatusOptionGroup)),
    name: v.string(),
    id: v.optional(v.string()),
  }),
  v.looseObject({
    color: v.optional(v.lazy(() => SelectColor)),
    description: v.optional(v.nullable(v.union([v.string()]))),
    group: v.optional(v.lazy(() => StatusOptionGroup)),
    id: v.string(),
    name: v.optional(v.string()),
  }),
])

export const StatusOptionUpdateRequestArray: v.GenericSchema<unknown, T.StatusOptionUpdateRequestArray> = v.pipe(
  v.array(v.lazy(() => StatusOptionUpdateRequest)),
  v.maxLength(100),
)

export const StatusOptionUpdateRequestCommon: v.GenericSchema<unknown, T.StatusOptionUpdateRequestCommon> =
  v.looseObject({
    color: v.optional(v.lazy(() => SelectColor)),
    description: v.optional(v.nullable(v.union([v.string()]))),
    group: v.optional(v.lazy(() => StatusOptionGroup)),
  })

export const StatusPropertyConfigRequest: v.GenericSchema<unknown, T.StatusPropertyConfigRequest> = v.looseObject({
  options: v.optional(v.lazy(() => StatusOptionRequestArray)),
})

export const StatusPropertyConfigUpdateRequest: v.GenericSchema<unknown, T.StatusPropertyConfigUpdateRequest> =
  v.looseObject({
    options: v.optional(v.lazy(() => StatusOptionUpdateRequestArray)),
  })

export const StatusPropertyConfigurationRequest: v.GenericSchema<unknown, T.StatusPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["status"])),
    status: v.lazy(() => StatusPropertyConfigRequest),
  })

export const StatusPropertyFilter: v.GenericSchema<unknown, T.StatusPropertyFilter> = v.union([
  v.lazy(() => StatusValueFilter),
  v.lazy(() => ExistencePropertyFilter),
])

export const StatusPropertyItemObjectResponse: v.GenericSchema<unknown, T.StatusPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["status"]),
    status: v.nullable(v.union([v.lazy(() => PartialSelectResponse)])),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const StatusPropertyResponse: v.GenericSchema<unknown, T.StatusPropertyResponse> = v.looseObject({
  id: v.string(),
  name: v.string(),
  color: v.lazy(() => SelectColor),
  description: v.nullable(v.union([v.string()])),
})

export const StatusSimplePropertyValueResponse: v.GenericSchema<unknown, T.StatusSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["status"]),
    status: v.nullable(v.union([v.lazy(() => PartialSelectPropertyValueResponse)])),
  })

export const StatusValueFilter: v.GenericSchema<unknown, T.StatusValueFilter> = v.union([
  v.looseObject({
    equals: v.lazy(() => StringOrStringArray),
  }),
  v.looseObject({
    does_not_equal: v.lazy(() => StringOrStringArray),
  }),
  v.looseObject({
    group_equals: v.lazy(() => StatusGroupNames),
  }),
  v.looseObject({
    group_does_not_equal: v.lazy(() => StatusGroupNames),
  }),
])

export const StringFormulaPropertyResponse: v.GenericSchema<unknown, T.StringFormulaPropertyResponse> = v.looseObject({
  type: v.picklist(["string"]),
  string: v.nullable(v.string()),
})

export const StringFormulaPropertyValueResponse: v.GenericSchema<unknown, T.StringFormulaPropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["string"]),
    string: v.nullable(v.union([v.string()])),
  })

export const StringOrStringArray: v.GenericSchema<unknown, T.StringOrStringArray> = v.union([
  v.string(),
  v.array(v.string()),
])

export const StringRequest: v.GenericSchema<unknown, T.StringRequest> = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(100),
)

export const SubtaskConfigRequest: v.GenericSchema<unknown, T.SubtaskConfigRequest> = v.looseObject({
  property_id: v.optional(v.string()),
  display_mode: v.optional(v.picklist(["show", "hidden", "flattened", "disabled"])),
  filter_scope: v.optional(v.picklist(["parents", "parents_and_subitems", "subitems"])),
  toggle_column_id: v.optional(v.string()),
})

export const SubtaskConfigResponse: v.GenericSchema<unknown, T.SubtaskConfigResponse> = v.looseObject({
  property_id: v.optional(v.string()),
  display_mode: v.optional(v.picklist(["show", "hidden", "flattened", "disabled"])),
  filter_scope: v.optional(v.picklist(["parents", "parents_and_subitems", "subitems"])),
  toggle_column_id: v.optional(v.string()),
})

export const SyncedBlockBlockObjectResponse: v.GenericSchema<unknown, T.SyncedBlockBlockObjectResponse> = v.looseObject(
  {
    type: v.picklist(["synced_block"]),
    synced_block: v.looseObject({
      synced_from: v.nullable(
        v.looseObject({
          type: v.picklist(["block_id"]),
          block_id: v.lazy(() => IdRequest),
        }),
      ),
    }),
    parent: v.lazy(() => ParentForBlockBasedObjectResponse),
    object: v.picklist(["block"]),
    id: v.string(),
    created_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_time: v.string(),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  },
)

export const TabBlockObjectResponse: v.GenericSchema<unknown, T.TabBlockObjectResponse> = v.looseObject({
  type: v.picklist(["tab"]),
  tab: v.lazy(() => EmptyObject),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const TabItemRequestWithSingleLevelOfChildren: v.GenericSchema<
  unknown,
  T.TabItemRequestWithSingleLevelOfChildren
> = v.looseObject({
  paragraph: v.lazy(() => ParagraphWithSingleLevelOfChildrenRequest),
  type: v.optional(v.picklist(["paragraph"])),
  object: v.optional(v.picklist(["block"])),
})

export const TabItemRequestWithoutChildren: v.GenericSchema<unknown, T.TabItemRequestWithoutChildren> = v.looseObject({
  paragraph: v.lazy(() => ContentWithRichTextColorAndIconRequest),
  type: v.optional(v.picklist(["paragraph"])),
  object: v.optional(v.picklist(["block"])),
})

export const TabRequestWithNestedTabItemChildren: v.GenericSchema<unknown, T.TabRequestWithNestedTabItemChildren> =
  v.looseObject({
    children: v.pipe(v.array(v.lazy(() => TabItemRequestWithSingleLevelOfChildren)), v.minLength(1), v.maxLength(100)),
  })

export const TabRequestWithTabItemChildren: v.GenericSchema<unknown, T.TabRequestWithTabItemChildren> = v.looseObject({
  children: v.pipe(v.array(v.lazy(() => TabItemRequestWithoutChildren)), v.minLength(1), v.maxLength(100)),
})

export const TableBlockObjectResponse: v.GenericSchema<unknown, T.TableBlockObjectResponse> = v.looseObject({
  type: v.picklist(["table"]),
  table: v.lazy(() => ContentWithTableResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const TableOfContentsBlockObjectResponse: v.GenericSchema<unknown, T.TableOfContentsBlockObjectResponse> =
  v.looseObject({
    type: v.picklist(["table_of_contents"]),
    table_of_contents: v.looseObject({
      color: v.lazy(() => ApiColor),
    }),
    parent: v.lazy(() => ParentForBlockBasedObjectResponse),
    object: v.picklist(["block"]),
    id: v.string(),
    created_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_time: v.string(),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  })

export const TableRequestWithTableRowChildren: v.GenericSchema<unknown, T.TableRequestWithTableRowChildren> =
  v.looseObject({
    table_width: integer({ minimum: 1 }),
    children: v.pipe(v.array(v.lazy(() => TableRowRequest)), v.minLength(1), v.maxLength(100)),
    has_column_header: v.optional(v.boolean()),
    has_row_header: v.optional(v.boolean()),
  })

export const TableRowBlockObjectResponse: v.GenericSchema<unknown, T.TableRowBlockObjectResponse> = v.looseObject({
  type: v.picklist(["table_row"]),
  table_row: v.lazy(() => ContentWithTableRowResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const TableRowRequest: v.GenericSchema<unknown, T.TableRowRequest> = v.looseObject({
  table_row: v.lazy(() => ContentWithTableRowRequest),
  type: v.optional(v.picklist(["table_row"])),
  object: v.optional(v.picklist(["block"])),
})

export const TableViewConfigRequest: v.GenericSchema<unknown, T.TableViewConfigRequest> = v.looseObject({
  type: v.picklist(["table"]),
  properties: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewPropertyConfigRequest)), v.maxLength(100))])),
  ),
  group_by: v.optional(v.nullable(v.union([v.lazy(() => GroupByConfigRequest)]))),
  subtasks: v.optional(v.nullable(v.union([v.lazy(() => SubtaskConfigRequest)]))),
  wrap_cells: v.optional(v.boolean()),
  frozen_column_index: v.optional(integer({ minimum: 0 })),
  show_vertical_lines: v.optional(v.boolean()),
})

export const TableViewConfigResponse: v.GenericSchema<unknown, T.TableViewConfigResponse> = v.looseObject({
  type: v.picklist(["table"]),
  properties: v.optional(v.pipe(v.array(v.lazy(() => ViewPropertyConfigResponse)), v.maxLength(100))),
  group_by: v.optional(v.lazy(() => GroupByConfigResponse)),
  subtasks: v.optional(v.lazy(() => SubtaskConfigResponse)),
  wrap_cells: v.optional(v.boolean()),
  frozen_column_index: v.optional(integer({ minimum: 0 })),
  show_vertical_lines: v.optional(v.boolean()),
})

export const TemplateBlockObjectResponse: v.GenericSchema<unknown, T.TemplateBlockObjectResponse> = v.looseObject({
  type: v.picklist(["template"]),
  template: v.looseObject({
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  }),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const TemplateMentionDateTemplateMentionRequest: v.GenericSchema<
  unknown,
  T.TemplateMentionDateTemplateMentionRequest
> = v.looseObject({
  type: v.optional(v.picklist(["template_mention_date"])),
  template_mention_date: v.picklist(["today", "now"]),
})

export const TemplateMentionDateTemplateMentionResponse: v.GenericSchema<
  unknown,
  T.TemplateMentionDateTemplateMentionResponse
> = v.looseObject({
  type: v.picklist(["template_mention_date"]),
  template_mention_date: v.picklist(["today", "now"]),
})

export const TemplateMentionRequest: v.GenericSchema<unknown, T.TemplateMentionRequest> = v.union([
  v.lazy(() => TemplateMentionDateTemplateMentionRequest),
  v.lazy(() => TemplateMentionUserTemplateMentionRequest),
])

export const TemplateMentionResponse: v.GenericSchema<unknown, T.TemplateMentionResponse> = v.union([
  v.lazy(() => TemplateMentionDateTemplateMentionResponse),
  v.lazy(() => TemplateMentionUserTemplateMentionResponse),
])

export const TemplateMentionUserTemplateMentionRequest: v.GenericSchema<
  unknown,
  T.TemplateMentionUserTemplateMentionRequest
> = v.looseObject({
  type: v.optional(v.picklist(["template_mention_user"])),
  template_mention_user: v.picklist(["me"]),
})

export const TemplateMentionUserTemplateMentionResponse: v.GenericSchema<
  unknown,
  T.TemplateMentionUserTemplateMentionResponse
> = v.looseObject({
  type: v.picklist(["template_mention_user"]),
  template_mention_user: v.picklist(["me"]),
})

export const TemplateTimezone: v.GenericSchema<unknown, T.TemplateTimezone> = v.string()

export const TextGroupByConfigRequest: v.GenericSchema<unknown, T.TextGroupByConfigRequest> = v.looseObject({
  type: v.picklist(["text", "title", "url", "email", "phone_number"]),
  property_id: v.string(),
  group_by: v.picklist(["exact", "alphabet_prefix"]),
  sort: v.lazy(() => GroupSortRequest),
  hide_empty_groups: v.optional(v.boolean()),
})

export const TextGroupByConfigResponse: v.GenericSchema<unknown, T.TextGroupByConfigResponse> = v.looseObject({
  type: v.picklist(["text", "title", "url", "email", "phone_number"]),
  property_id: v.string(),
  group_by: v.picklist(["exact", "alphabet_prefix"]),
  sort: v.lazy(() => GroupSortResponse),
  property_name: v.optional(v.string()),
  hide_empty_groups: v.optional(v.boolean()),
})

export const TextPropertyFilter: v.GenericSchema<unknown, T.TextPropertyFilter> = v.union([
  v.union([
    v.looseObject({
      equals: v.string(),
    }),
    v.looseObject({
      does_not_equal: v.string(),
    }),
    v.looseObject({
      contains: v.string(),
    }),
    v.looseObject({
      does_not_contain: v.string(),
    }),
    v.looseObject({
      starts_with: v.string(),
    }),
    v.looseObject({
      ends_with: v.string(),
    }),
  ]),
  v.lazy(() => ExistencePropertyFilter),
])

export const TextRequest: v.GenericSchema<unknown, T.TextRequest> = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(2000),
)

export const TextRichTextItemRequest: v.GenericSchema<unknown, T.TextRichTextItemRequest> = v.looseObject({
  type: v.optional(v.picklist(["text"])),
  text: v.looseObject({
    content: v.pipe(v.string(), v.maxLength(2000)),
    link: v.optional(
      v.nullable(
        v.union([
          v.looseObject({
            url: v.string(),
          }),
        ]),
      ),
    ),
  }),
})

export const TextRichTextItemResponse: v.GenericSchema<unknown, T.TextRichTextItemResponse> = v.looseObject({
  type: v.picklist(["text"]),
  text: v.looseObject({
    content: v.pipe(v.string(), v.maxLength(2000)),
    link: v.nullable(
      v.union([
        v.looseObject({
          url: v.string(),
        }),
      ]),
    ),
  }),
})

export const TimeZoneRequest: v.GenericSchema<unknown, T.TimeZoneRequest> = v.string()

export const TimelineArrowsByRequest: v.GenericSchema<unknown, T.TimelineArrowsByRequest> = v.looseObject({
  property_id: v.optional(v.nullable(v.union([v.string()]))),
})

export const TimelineArrowsByResponse: v.GenericSchema<unknown, T.TimelineArrowsByResponse> = v.looseObject({
  property_id: v.optional(v.nullable(v.union([v.string()]))),
})

export const TimelinePreferenceRequest: v.GenericSchema<unknown, T.TimelinePreferenceRequest> = v.looseObject({
  zoom_level: v.picklist(["hours", "day", "week", "bi_week", "month", "quarter", "year", "5_years"]),
  center_timestamp: v.optional(integer()),
})

export const TimelinePreferenceResponse: v.GenericSchema<unknown, T.TimelinePreferenceResponse> = v.looseObject({
  zoom_level: v.picklist(["hours", "day", "week", "bi_week", "month", "quarter", "year", "5_years"]),
  center_timestamp: v.optional(integer({ minimum: 0 })),
})

export const TimelineViewConfigRequest: v.GenericSchema<unknown, T.TimelineViewConfigRequest> = v.looseObject({
  type: v.picklist(["timeline"]),
  date_property_id: v.string(),
  end_date_property_id: v.optional(v.nullable(v.union([v.string()]))),
  properties: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewPropertyConfigRequest)), v.maxLength(100))])),
  ),
  show_table: v.optional(v.nullable(v.union([v.boolean()]))),
  table_properties: v.optional(
    v.nullable(v.union([v.pipe(v.array(v.lazy(() => ViewPropertyConfigRequest)), v.maxLength(100))])),
  ),
  preference: v.optional(v.nullable(v.union([v.lazy(() => TimelinePreferenceRequest)]))),
  arrows_by: v.optional(v.nullable(v.union([v.lazy(() => TimelineArrowsByRequest)]))),
  color_by: v.optional(v.nullable(v.union([v.boolean()]))),
})

export const TimelineViewConfigResponse: v.GenericSchema<unknown, T.TimelineViewConfigResponse> = v.looseObject({
  type: v.picklist(["timeline"]),
  date_property_id: v.string(),
  date_property_name: v.optional(v.string()),
  end_date_property_id: v.optional(v.string()),
  end_date_property_name: v.optional(v.string()),
  properties: v.optional(v.pipe(v.array(v.lazy(() => ViewPropertyConfigResponse)), v.maxLength(100))),
  show_table: v.optional(v.boolean()),
  table_properties: v.optional(v.pipe(v.array(v.lazy(() => ViewPropertyConfigResponse)), v.maxLength(100))),
  preference: v.optional(v.lazy(() => TimelinePreferenceResponse)),
  arrows_by: v.optional(v.lazy(() => TimelineArrowsByResponse)),
  color_by: v.optional(v.boolean()),
})

export const TimestampCreatedTimeFilter: v.GenericSchema<unknown, T.TimestampCreatedTimeFilter> = v.looseObject({
  created_time: v.lazy(() => DatePropertyFilter),
  timestamp: v.picklist(["created_time"]),
  type: v.optional(v.picklist(["created_time"])),
})

export const TimestampFilter: v.GenericSchema<unknown, T.TimestampFilter> = v.union([
  v.lazy(() => TimestampCreatedTimeFilter),
  v.lazy(() => TimestampLastEditedTimeFilter),
])

export const TimestampLastEditedTimeFilter: v.GenericSchema<unknown, T.TimestampLastEditedTimeFilter> = v.looseObject({
  last_edited_time: v.lazy(() => DatePropertyFilter),
  timestamp: v.picklist(["last_edited_time"]),
  type: v.optional(v.picklist(["last_edited_time"])),
})

export const TimestampSortResponse: v.GenericSchema<unknown, T.TimestampSortResponse> = v.looseObject({
  timestamp: v.picklist(["created_time", "last_edited_time"]),
  direction: v.picklist(["ascending", "descending"]),
})

export const TitleArrayBasedPropertyValueResponse: v.GenericSchema<unknown, T.TitleArrayBasedPropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["title"]),
    title: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
  })

export const TitleDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.TitleDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["title"]),
    title: v.lazy(() => EmptyObject),
  })

export const TitleObjectResponse: v.GenericSchema<unknown, T.TitleObjectResponse> = v.looseObject({
  title: v.string(),
})

export const TitlePropertyConfigurationRequest: v.GenericSchema<unknown, T.TitlePropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["title"])),
    title: v.lazy(() => EmptyObject),
  })

export const TitlePropertyItemObjectResponse: v.GenericSchema<unknown, T.TitlePropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["title"]),
    title: v.lazy(() => RichTextItemResponse),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const ToDoBlockObjectResponse: v.GenericSchema<unknown, T.ToDoBlockObjectResponse> = v.looseObject({
  type: v.picklist(["to_do"]),
  to_do: v.looseObject({
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100)),
    color: v.lazy(() => ApiColor),
    checked: v.boolean(),
  }),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const ToggleBlockObjectResponse: v.GenericSchema<unknown, T.ToggleBlockObjectResponse> = v.looseObject({
  type: v.picklist(["toggle"]),
  toggle: v.lazy(() => ContentWithRichTextAndColorResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const TranscriptionBlockResponse: v.GenericSchema<unknown, T.TranscriptionBlockResponse> = v.looseObject({
  is_full_page: v.boolean(),
  title: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100))),
  status: v.optional(v.lazy(() => ApiTranscriptionStatus)),
  children: v.optional(v.lazy(() => TranscriptionChildrenResponse)),
  calendar_event: v.optional(v.lazy(() => TranscriptionCalendarEventResponse)),
  recording: v.optional(v.lazy(() => TranscriptionRecordingResponse)),
})

export const TranscriptionCalendarEventResponse: v.GenericSchema<unknown, T.TranscriptionCalendarEventResponse> =
  v.looseObject({
    start_time: v.string(),
    end_time: v.string(),
    event_id: v.optional(v.string()),
    attendees: v.optional(v.pipe(v.array(v.lazy(() => IdRequest)), v.maxLength(100))),
  })

export const TranscriptionChildrenResponse: v.GenericSchema<unknown, T.TranscriptionChildrenResponse> = v.looseObject({
  summary_block_id: v.optional(v.lazy(() => IdRequest)),
  notes_block_id: v.optional(v.lazy(() => IdRequest)),
  transcript_block_id: v.optional(v.lazy(() => IdRequest)),
})

export const TranscriptionRecordingResponse: v.GenericSchema<unknown, T.TranscriptionRecordingResponse> = v.looseObject(
  {
    start_time: v.optional(v.string()),
    end_time: v.optional(v.string()),
  },
)

export const UniqueIdDatabasePropertyConfigResponse: v.GenericSchema<
  unknown,
  T.UniqueIdDatabasePropertyConfigResponse
> = v.looseObject({
  type: v.picklist(["unique_id"]),
  unique_id: v.looseObject({
    prefix: v.nullable(v.union([v.string()])),
  }),
})

export const UniqueIdPropertyConfigurationRequest: v.GenericSchema<unknown, T.UniqueIdPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["unique_id"])),
    unique_id: v.looseObject({
      prefix: v.optional(v.nullable(v.union([v.string()]))),
    }),
  })

export const UniqueIdPropertyItemObjectResponse: v.GenericSchema<unknown, T.UniqueIdPropertyItemObjectResponse> =
  v.looseObject({
    type: v.picklist(["unique_id"]),
    unique_id: v.looseObject({
      prefix: v.nullable(v.string()),
      number: v.nullable(number()),
    }),
    object: v.picklist(["property_item"]),
    id: v.string(),
  })

export const UniqueIdPropertyValueResponse: v.GenericSchema<unknown, T.UniqueIdPropertyValueResponse> = v.looseObject({
  prefix: v.nullable(v.union([v.string()])),
  number: v.nullable(v.union([number()])),
})

export const UniqueIdSimplePropertyValueResponse: v.GenericSchema<unknown, T.UniqueIdSimplePropertyValueResponse> =
  v.looseObject({
    type: v.picklist(["unique_id"]),
    unique_id: v.lazy(() => UniqueIdPropertyValueResponse),
  })

export const UnsupportedBlockObjectResponse: v.GenericSchema<unknown, T.UnsupportedBlockObjectResponse> = v.looseObject(
  {
    type: v.picklist(["unsupported"]),
    unsupported: v.looseObject({
      block_type: v.string(),
    }),
    parent: v.lazy(() => ParentForBlockBasedObjectResponse),
    object: v.picklist(["block"]),
    id: v.string(),
    created_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_time: v.string(),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  },
)

export const UnsupportedFormulaPropertyResponse: v.GenericSchema<unknown, T.UnsupportedFormulaPropertyResponse> =
  v.looseObject({
    type: v.picklist(["unsupported"]),
    unsupported: v.lazy(() => EmptyObject),
  })

export const UnsupportedFormulaPropertyValueResponse: v.GenericSchema<
  unknown,
  T.UnsupportedFormulaPropertyValueResponse
> = v.looseObject({
  type: v.picklist(["unsupported"]),
  unsupported: v.lazy(() => EmptyObject),
})

export const UnsupportedPartialRollupValueResponse: v.GenericSchema<unknown, T.UnsupportedPartialRollupValueResponse> =
  v.looseObject({
    type: v.picklist(["unsupported"]),
    unsupported: v.lazy(() => EmptyObject),
  })

export const UpdateEmbedFileUploadRequest: v.GenericSchema<unknown, T.UpdateEmbedFileUploadRequest> = v.looseObject({
  file_upload: v.lazy(() => FileUploadIdRequest),
  caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
})

export const UpdateMediaContentWithFileAndCaptionRequest: v.GenericSchema<
  unknown,
  T.UpdateMediaContentWithFileAndCaptionRequest
> = v.looseObject({
  caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  external: v.optional(v.lazy(() => ExternalFileRequest)),
  file_upload: v.optional(v.lazy(() => FileUploadIdRequest)),
})

export const UpdateMediaContentWithFileNameAndCaptionRequest: v.GenericSchema<
  unknown,
  T.UpdateMediaContentWithFileNameAndCaptionRequest
> = v.looseObject({
  caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  external: v.optional(v.lazy(() => ExternalFileRequest)),
  file_upload: v.optional(v.lazy(() => FileUploadIdRequest)),
  name: v.optional(v.lazy(() => StringRequest)),
})

export const UpdateMediaContentWithUrlAndCaptionRequest: v.GenericSchema<
  unknown,
  T.UpdateMediaContentWithUrlAndCaptionRequest
> = v.looseObject({
  url: v.optional(v.string()),
  caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
})

export const UpdateViewRequest: v.GenericSchema<unknown, T.UpdateViewRequest> = v.looseObject({
  name: v.optional(v.string()),
  filter: v.optional(v.nullable(v.union([v.lazy(() => ViewFilterRequest)]))),
  sorts: v.optional(v.nullable(v.union([v.lazy(() => ViewPropertySortsRequest)]))),
  quick_filters: v.optional(
    v.nullable(v.union([v.record(v.string(), v.nullable(v.union([v.lazy(() => QuickFilterConditionRequest)])))])),
  ),
  configuration: v.optional(v.lazy(() => ViewConfigRequest)),
})

export const UrlDatabasePropertyConfigResponse: v.GenericSchema<unknown, T.UrlDatabasePropertyConfigResponse> =
  v.looseObject({
    type: v.picklist(["url"]),
    url: v.lazy(() => EmptyObject),
  })

export const UrlPropertyConfigurationRequest: v.GenericSchema<unknown, T.UrlPropertyConfigurationRequest> =
  v.looseObject({
    type: v.optional(v.picklist(["url"])),
    url: v.lazy(() => EmptyObject),
  })

export const UrlPropertyItemObjectResponse: v.GenericSchema<unknown, T.UrlPropertyItemObjectResponse> = v.looseObject({
  type: v.picklist(["url"]),
  url: v.nullable(v.string()),
  object: v.picklist(["property_item"]),
  id: v.string(),
})

export const UrlSimplePropertyValueResponse: v.GenericSchema<unknown, T.UrlSimplePropertyValueResponse> = v.looseObject(
  {
    type: v.picklist(["url"]),
    url: v.nullable(v.union([v.string()])),
  },
)

export const UserObjectResponse: v.GenericSchema<unknown, T.UserObjectResponse> = v.union([
  v.looseObject({
    id: v.lazy(() => IdResponse),
    object: v.picklist(["user"]),
    name: v.nullable(v.union([v.string()])),
    avatar_url: v.nullable(v.union([v.string()])),
    agent_id: v.optional(v.lazy(() => IdResponse)),
    type: v.picklist(["person"]),
    person: v.looseObject({
      email: v.optional(v.string()),
      email_verified: v.optional(v.boolean()),
    }),
  }),
  v.looseObject({
    id: v.lazy(() => IdResponse),
    object: v.picklist(["user"]),
    name: v.nullable(v.union([v.string()])),
    avatar_url: v.nullable(v.union([v.string()])),
    agent_id: v.optional(v.lazy(() => IdResponse)),
    type: v.picklist(["bot"]),
    bot: v.union([v.lazy(() => EmptyObject), v.lazy(() => BotInfoResponse)]),
  }),
])

export const UserObjectResponseCommon: v.GenericSchema<unknown, T.UserObjectResponseCommon> = v.looseObject({
  id: v.lazy(() => IdResponse),
  object: v.picklist(["user"]),
  name: v.nullable(v.union([v.string()])),
  avatar_url: v.nullable(v.union([v.string()])),
  agent_id: v.optional(v.lazy(() => IdResponse)),
})

export const UserValueResponse: v.GenericSchema<unknown, T.UserValueResponse> = v.union([
  v.lazy(() => PartialUserObjectResponse),
  v.lazy(() => UserObjectResponse),
])

export const VerificationPropertyConfigurationRequest: v.GenericSchema<
  unknown,
  T.VerificationPropertyConfigurationRequest
> = v.looseObject({
  type: v.optional(v.picklist(["verification"])),
  verification: v.lazy(() => EmptyObject),
})

export const VerificationPropertyDoesNotEqualFilter: v.GenericSchema<
  unknown,
  T.VerificationPropertyDoesNotEqualFilter
> = v.looseObject({
  does_not_equal: v.picklist(["verified", "expired", "none"]),
})

export const VerificationPropertyItemObjectResponse: v.GenericSchema<
  unknown,
  T.VerificationPropertyItemObjectResponse
> = v.looseObject({
  type: v.picklist(["verification"]),
  verification: v.nullable(v.union([v.lazy(() => VerificationPropertyValueResponse)])),
  object: v.picklist(["property_item"]),
  id: v.string(),
})

export const VerificationPropertyResponse: v.GenericSchema<unknown, T.VerificationPropertyResponse> = v.looseObject({
  state: v.picklist(["verified", "expired"]),
  date: v.nullable(v.union([v.lazy(() => DateResponse)])),
  verified_by: v.nullable(v.union([v.lazy(() => UserValueResponse)])),
})

export const VerificationPropertyStatusFilter: v.GenericSchema<unknown, T.VerificationPropertyStatusFilter> =
  v.looseObject({
    status: v.picklist(["verified", "expired", "none"]),
  })

export const VerificationPropertyUnverifiedResponse: v.GenericSchema<
  unknown,
  T.VerificationPropertyUnverifiedResponse
> = v.looseObject({
  state: v.picklist(["unverified"]),
  date: v.unknown(),
  verified_by: v.unknown(),
})

export const VerificationPropertyValueResponse: v.GenericSchema<unknown, T.VerificationPropertyValueResponse> = v.union(
  [v.lazy(() => VerificationPropertyUnverifiedResponse), v.lazy(() => VerificationPropertyResponse)],
)

export const VerificationSimplePropertyValueResponse: v.GenericSchema<
  unknown,
  T.VerificationSimplePropertyValueResponse
> = v.looseObject({
  type: v.picklist(["verification"]),
  verification: v.nullable(v.union([v.lazy(() => VerificationPropertyValueResponse)])),
})

export const VideoBlockObjectResponse: v.GenericSchema<unknown, T.VideoBlockObjectResponse> = v.looseObject({
  type: v.picklist(["video"]),
  video: v.lazy(() => MediaContentWithFileAndCaptionResponse),
  parent: v.lazy(() => ParentForBlockBasedObjectResponse),
  object: v.picklist(["block"]),
  id: v.string(),
  created_time: v.string(),
  created_by: v.lazy(() => PartialUserObjectResponse),
  last_edited_time: v.string(),
  last_edited_by: v.lazy(() => PartialUserObjectResponse),
  has_children: v.boolean(),
  in_trash: v.boolean(),
})

export const ViewConfigRequest: v.GenericSchema<unknown, T.ViewConfigRequest> = v.union([
  v.lazy(() => TableViewConfigRequest),
  v.lazy(() => BoardViewConfigRequest),
  v.lazy(() => CalendarViewConfigRequest),
  v.lazy(() => TimelineViewConfigRequest),
  v.lazy(() => GalleryViewConfigRequest),
  v.lazy(() => ListViewConfigRequest),
  v.lazy(() => MapViewConfigRequest),
  v.lazy(() => FormViewConfigRequest),
  v.lazy(() => ChartViewConfigRequest),
])

export const ViewConfigResponse: v.GenericSchema<unknown, T.ViewConfigResponse> = v.union([
  v.lazy(() => TableViewConfigResponse),
  v.lazy(() => BoardViewConfigResponse),
  v.lazy(() => CalendarViewConfigResponse),
  v.lazy(() => TimelineViewConfigResponse),
  v.lazy(() => GalleryViewConfigResponse),
  v.lazy(() => ListViewConfigResponse),
  v.lazy(() => MapViewConfigResponse),
  v.lazy(() => FormViewConfigResponse),
  v.lazy(() => ChartViewConfigResponse),
  v.lazy(() => DashboardViewConfigResponse),
])

export const ViewCreatedWebhookPayload: v.GenericSchema<unknown, T.ViewCreatedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["view.created"]),
  entity: v.lazy(() => WebhookViewEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
    view_type: v.string(),
  }),
})

export const ViewDeletedWebhookPayload: v.GenericSchema<unknown, T.ViewDeletedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["view.deleted"]),
  entity: v.lazy(() => WebhookViewEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
  }),
})

export const ViewFilterRequest: v.GenericSchema<unknown, T.ViewFilterRequest> = v.union([
  v.union([
    v.looseObject({
      or: v.lazy(() => GroupFilterOperatorArray),
    }),
    v.looseObject({
      and: v.lazy(() => GroupFilterOperatorArray),
    }),
  ]),
  v.lazy(() => PropertyFilter),
  v.lazy(() => TimestampFilter),
])

export const ViewFilterResponse: v.GenericSchema<unknown, T.ViewFilterResponse> = v.union([
  v.objectWithRest(
    {
      property: v.string(),
    },
    v.unknown(),
  ),
  v.objectWithRest(
    {
      timestamp: v.picklist(["created_time", "last_edited_time"]),
    },
    v.unknown(),
  ),
  v.looseObject({
    or: v.optional(
      v.array(
        v.union([
          v.objectWithRest(
            {
              property: v.string(),
            },
            v.unknown(),
          ),
          v.objectWithRest(
            {
              timestamp: v.picklist(["created_time", "last_edited_time"]),
            },
            v.unknown(),
          ),
          v.looseObject({
            or: v.optional(
              v.array(
                v.union([
                  v.objectWithRest(
                    {
                      property: v.string(),
                    },
                    v.unknown(),
                  ),
                  v.objectWithRest(
                    {
                      timestamp: v.picklist(["created_time", "last_edited_time"]),
                    },
                    v.unknown(),
                  ),
                ]),
              ),
            ),
            and: v.optional(
              v.array(
                v.union([
                  v.objectWithRest(
                    {
                      property: v.string(),
                    },
                    v.unknown(),
                  ),
                  v.objectWithRest(
                    {
                      timestamp: v.picklist(["created_time", "last_edited_time"]),
                    },
                    v.unknown(),
                  ),
                ]),
              ),
            ),
          }),
        ]),
      ),
    ),
    and: v.optional(
      v.array(
        v.union([
          v.objectWithRest(
            {
              property: v.string(),
            },
            v.unknown(),
          ),
          v.objectWithRest(
            {
              timestamp: v.picklist(["created_time", "last_edited_time"]),
            },
            v.unknown(),
          ),
          v.looseObject({
            or: v.optional(
              v.array(
                v.union([
                  v.objectWithRest(
                    {
                      property: v.string(),
                    },
                    v.unknown(),
                  ),
                  v.objectWithRest(
                    {
                      timestamp: v.picklist(["created_time", "last_edited_time"]),
                    },
                    v.unknown(),
                  ),
                ]),
              ),
            ),
            and: v.optional(
              v.array(
                v.union([
                  v.objectWithRest(
                    {
                      property: v.string(),
                    },
                    v.unknown(),
                  ),
                  v.objectWithRest(
                    {
                      timestamp: v.picklist(["created_time", "last_edited_time"]),
                    },
                    v.unknown(),
                  ),
                ]),
              ),
            ),
          }),
        ]),
      ),
    ),
  }),
])

export const ViewPositionRequest: v.GenericSchema<unknown, T.ViewPositionRequest> = v.union([
  v.looseObject({
    type: v.picklist(["start"]),
  }),
  v.looseObject({
    type: v.picklist(["end"]),
  }),
  v.looseObject({
    type: v.picklist(["after_view"]),
    view_id: v.lazy(() => IdRequest),
  }),
])

export const ViewPropertyConfigRequest: v.GenericSchema<unknown, T.ViewPropertyConfigRequest> = v.looseObject({
  property_id: v.string(),
  visible: v.optional(v.boolean()),
  width: v.optional(integer({ minimum: 1 })),
  wrap: v.optional(v.boolean()),
  status_show_as: v.optional(v.picklist(["select", "checkbox"])),
  card_property_width_mode: v.optional(v.picklist(["full_line", "inline"])),
  date_format: v.optional(
    v.picklist(["full", "short", "month_day_year", "day_month_year", "year_month_day", "relative"]),
  ),
  time_format: v.optional(v.picklist(["12_hour", "24_hour", "hidden"])),
})

export const ViewPropertyConfigResponse: v.GenericSchema<unknown, T.ViewPropertyConfigResponse> = v.looseObject({
  property_id: v.string(),
  property_name: v.optional(v.string()),
  visible: v.optional(v.boolean()),
  width: v.optional(integer({ minimum: 0 })),
  wrap: v.optional(v.boolean()),
  status_show_as: v.optional(v.picklist(["select", "checkbox"])),
  card_property_width_mode: v.optional(v.picklist(["full_line", "inline"])),
  date_format: v.optional(
    v.picklist(["full", "short", "month_day_year", "day_month_year", "year_month_day", "relative"]),
  ),
  time_format: v.optional(v.picklist(["12_hour", "24_hour", "hidden"])),
})

export const ViewPropertySortRequest: v.GenericSchema<unknown, T.ViewPropertySortRequest> = v.looseObject({
  property: v.string(),
  direction: v.lazy(() => SortDirectionRequest),
})

export const ViewPropertySortsRequest: v.GenericSchema<unknown, T.ViewPropertySortsRequest> = v.pipe(
  v.array(v.lazy(() => ViewPropertySortRequest)),
  v.maxLength(100),
)

export const ViewQueryResponse: v.GenericSchema<unknown, T.ViewQueryResponse> = v.looseObject({
  object: v.picklist(["view_query"]),
  id: v.lazy(() => IdResponse),
  view_id: v.lazy(() => IdResponse),
  expires_at: v.string(),
  total_count: number(),
  results: v.pipe(v.array(v.lazy(() => PageReferenceResponse)), v.maxLength(100)),
  next_cursor: v.nullable(v.union([v.lazy(() => IdResponse)])),
  has_more: v.boolean(),
  request_status: v.optional(v.lazy(() => RequestStatusResponse)),
})

export const ViewSortRequest: v.GenericSchema<unknown, T.ViewSortRequest> = v.union([
  v.looseObject({
    property: v.string(),
    direction: v.picklist(["ascending", "descending"]),
  }),
  v.looseObject({
    timestamp: v.picklist(["created_time", "last_edited_time"]),
    direction: v.picklist(["ascending", "descending"]),
  }),
])

export const ViewSortResponse: v.GenericSchema<unknown, T.ViewSortResponse> = v.union([
  v.lazy(() => PropertySortResponse),
  v.lazy(() => TimestampSortResponse),
])

export const ViewSortsRequest: v.GenericSchema<unknown, T.ViewSortsRequest> = v.pipe(
  v.array(v.lazy(() => ViewSortRequest)),
  v.maxLength(100),
)

export const ViewTypeRequest: v.GenericSchema<unknown, T.ViewTypeRequest> = v.picklist([
  "table",
  "board",
  "list",
  "calendar",
  "timeline",
  "gallery",
  "form",
  "chart",
  "map",
  "dashboard",
])

export const ViewUpdatedWebhookPayload: v.GenericSchema<unknown, T.ViewUpdatedWebhookPayload> = v.looseObject({
  id: v.string(),
  timestamp: v.string(),
  workspace_id: v.lazy(() => IdResponse),
  workspace_name: v.string(),
  subscription_id: v.lazy(() => IdResponse),
  integration_id: v.lazy(() => IdResponse),
  authors: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["person"]),
        }),
        v.looseObject({
          id: v.lazy(() => IdResponse),
          type: v.picklist(["bot"]),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  attempt_number: integer(),
  api_version: v.picklist(["2022-06-28", "2025-09-03", "2026-03-11"]),
  accessible_by: v.optional(
    v.pipe(
      v.array(
        v.union([
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["person"]),
          }),
          v.looseObject({
            id: v.lazy(() => IdResponse),
            type: v.picklist(["bot"]),
          }),
        ]),
      ),
      v.maxLength(100),
    ),
  ),
  type: v.picklist(["view.updated"]),
  entity: v.lazy(() => WebhookViewEntity),
  data: v.looseObject({
    parent: v.lazy(() => WebhookParentBlock),
    updated_fields: v.pipe(v.array(v.picklist(["name", "filter", "sorts", "configuration"])), v.maxLength(100)),
  }),
})

export const WebhookCommentEntity: v.GenericSchema<unknown, T.WebhookCommentEntity> = v.looseObject({
  type: v.picklist(["comment"]),
  id: v.lazy(() => IdResponse),
})

export const WebhookDatabaseEventEntity: v.GenericSchema<unknown, T.WebhookDatabaseEventEntity> = v.looseObject({
  id: v.lazy(() => IdResponse),
  type: v.picklist(["block", "database", "data_source"]),
})

export const WebhookExternalBlock: v.GenericSchema<unknown, T.WebhookExternalBlock> = v.looseObject({
  id: v.lazy(() => IdResponse),
  type: v.picklist(["page", "database", "block"]),
})

export const WebhookFileUploadEntity: v.GenericSchema<unknown, T.WebhookFileUploadEntity> = v.looseObject({
  type: v.picklist(["file_upload"]),
  id: v.lazy(() => IdResponse),
})

export const WebhookPageEntity: v.GenericSchema<unknown, T.WebhookPageEntity> = v.looseObject({
  type: v.picklist(["page"]),
  id: v.lazy(() => IdResponse),
})

export const WebhookParentBlock: v.GenericSchema<unknown, T.WebhookParentBlock> = v.looseObject({
  id: v.lazy(() => IdResponse),
  type: v.picklist(["space", "block", "page", "database", "team", "agent"]),
  data_source_id: v.optional(v.lazy(() => IdResponse)),
})

export const WebhookUpdatedBlock: v.GenericSchema<unknown, T.WebhookUpdatedBlock> = v.looseObject({
  id: v.lazy(() => IdResponse),
  type: v.picklist(["page", "database", "block"]),
})

export const WebhookViewEntity: v.GenericSchema<unknown, T.WebhookViewEntity> = v.looseObject({
  id: v.lazy(() => IdResponse),
  type: v.picklist(["view"]),
})

export const WidgetPlacementRequest: v.GenericSchema<unknown, T.WidgetPlacementRequest> = v.union([
  v.looseObject({
    type: v.picklist(["new_row"]),
    row_index: v.optional(integer({ minimum: 0 })),
  }),
  v.looseObject({
    type: v.picklist(["existing_row"]),
    row_index: integer({ minimum: 0 }),
  }),
])

export const WorkspaceParentForBlockBasedObjectResponse: v.GenericSchema<
  unknown,
  T.WorkspaceParentForBlockBasedObjectResponse
> = v.looseObject({
  type: v.picklist(["workspace"]),
  workspace: v.literal(true),
})

export const GetUsersResponse: v.GenericSchema<unknown, T.GetUsersResponse> = v.looseObject({
  type: v.picklist(["user"]),
  user: v.lazy(() => EmptyObject),
  object: v.picklist(["list"]),
  next_cursor: v.nullable(v.string()),
  has_more: v.boolean(),
  results: v.array(v.lazy(() => UserObjectResponse)),
})

export const PostPageRequest: v.GenericSchema<unknown, T.PostPageRequest> = v.looseObject({
  parent: v.optional(
    v.union([
      v.looseObject({
        page_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["page_id"])),
      }),
      v.looseObject({
        database_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["database_id"])),
      }),
      v.looseObject({
        data_source_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["data_source_id"])),
      }),
      v.looseObject({
        workspace: v.literal(true),
        type: v.optional(v.picklist(["workspace"])),
      }),
    ]),
  ),
  properties: v.optional(v.lazy(() => PagePropertiesRequest)),
  icon: v.optional(v.nullable(v.union([v.lazy(() => PageIconRequest)]))),
  cover: v.optional(v.nullable(v.union([v.lazy(() => PageCoverRequest)]))),
  content: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequest)), v.maxLength(100))),
  children: v.optional(v.pipe(v.array(v.lazy(() => BlockObjectRequest)), v.maxLength(100))),
  markdown: v.optional(v.string()),
  allow_async: v.optional(v.boolean()),
  markdown_version: v.optional(v.picklist(["v1", "v2"])),
  template: v.optional(
    v.union([
      v.looseObject({
        type: v.picklist(["none"]),
      }),
      v.looseObject({
        type: v.picklist(["default"]),
        timezone: v.optional(v.lazy(() => TemplateTimezone)),
      }),
      v.looseObject({
        type: v.picklist(["template_id"]),
        template_id: v.lazy(() => IdRequest),
        timezone: v.optional(v.lazy(() => TemplateTimezone)),
      }),
    ]),
  ),
  position: v.optional(v.lazy(() => PagePositionSchema)),
  notifications: v.optional(v.lazy(() => PageWriteNotificationsSchema)),
})

export const PostPageResponse: v.GenericSchema<unknown, T.PostPageResponse> = v.union([
  v.lazy(() => PageObjectResponse),
  v.lazy(() => PartialPageObjectResponse),
])

export const RetrieveAPageResponse: v.GenericSchema<unknown, T.RetrieveAPageResponse> = v.union([
  v.lazy(() => PartialPageObjectResponse),
  v.lazy(() => PageObjectResponse),
])

export const PatchPageRequest: v.GenericSchema<unknown, T.PatchPageRequest> = v.looseObject({
  properties: v.optional(v.lazy(() => PagePropertiesRequest)),
  icon: v.optional(v.nullable(v.union([v.lazy(() => PageIconRequest)]))),
  cover: v.optional(v.nullable(v.union([v.lazy(() => PageCoverRequest)]))),
  is_locked: v.optional(v.boolean()),
  template: v.optional(
    v.union([
      v.looseObject({
        type: v.picklist(["default"]),
        timezone: v.optional(v.lazy(() => TemplateTimezone)),
      }),
      v.looseObject({
        type: v.picklist(["template_id"]),
        template_id: v.lazy(() => IdRequest),
        timezone: v.optional(v.lazy(() => TemplateTimezone)),
      }),
    ]),
  ),
  erase_content: v.optional(v.boolean()),
  notifications: v.optional(v.lazy(() => PageWriteNotificationsSchema)),
  in_trash: v.optional(v.boolean()),
  is_archived: v.optional(v.boolean()),
})

export const PatchPageResponse: v.GenericSchema<unknown, T.PatchPageResponse> = v.union([
  v.lazy(() => PageObjectResponse),
  v.lazy(() => PartialPageObjectResponse),
])

export const MovePageRequest: v.GenericSchema<unknown, T.MovePageRequest> = v.looseObject({
  parent: v.union([
    v.looseObject({
      page_id: v.lazy(() => IdRequest),
      type: v.optional(v.picklist(["page_id"])),
    }),
    v.looseObject({
      data_source_id: v.lazy(() => IdRequest),
      type: v.optional(v.picklist(["data_source_id"])),
    }),
  ]),
})

export const MovePageResponse: v.GenericSchema<unknown, T.MovePageResponse> = v.union([
  v.lazy(() => PartialPageObjectResponse),
  v.lazy(() => PageObjectResponse),
])

export const RetrieveAPagePropertyResponse: v.GenericSchema<unknown, T.RetrieveAPagePropertyResponse> = v.union([
  v.lazy(() => PropertyItemObjectResponse),
  v.lazy(() => PropertyItemListResponse),
])

export const UpdatePageMarkdownRequest: v.GenericSchema<unknown, T.UpdatePageMarkdownRequest> = v.union([
  v.looseObject({
    allow_async: v.optional(v.boolean()),
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    type: v.picklist(["insert_content"]),
    insert_content: v.looseObject({
      content: v.string(),
      after: v.optional(v.string()),
      position: v.optional(
        v.union([
          v.looseObject({
            type: v.picklist(["start"]),
          }),
          v.looseObject({
            type: v.picklist(["end"]),
          }),
        ]),
      ),
    }),
  }),
  v.looseObject({
    allow_async: v.optional(v.boolean()),
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    type: v.picklist(["replace_content_range"]),
    replace_content_range: v.looseObject({
      content: v.string(),
      content_range: v.string(),
      allow_deleting_content: v.optional(v.boolean()),
    }),
  }),
  v.looseObject({
    allow_async: v.optional(v.boolean()),
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    type: v.picklist(["update_content"]),
    update_content: v.looseObject({
      content_updates: v.pipe(
        v.array(
          v.looseObject({
            old_str: v.pipe(v.string(), v.minLength(1)),
            new_str: v.string(),
            replace_all_matches: v.optional(v.boolean()),
          }),
        ),
        v.maxLength(100),
      ),
      allow_deleting_content: v.optional(v.boolean()),
    }),
  }),
  v.looseObject({
    allow_async: v.optional(v.boolean()),
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    type: v.picklist(["replace_content"]),
    replace_content: v.looseObject({
      new_str: v.string(),
      allow_deleting_content: v.optional(v.boolean()),
    }),
  }),
])

export const RetrieveAsyncTaskResponse: v.GenericSchema<unknown, T.RetrieveAsyncTaskResponse> = v.union([
  v.looseObject({
    object: v.picklist(["async_task"]),
    id: v.pipe(v.string(), v.minLength(1)),
    status_url: v.pipe(v.string(), v.minLength(1)),
    created_time: v.string(),
    operation: v.looseObject({
      surface: v.picklist(["rest", "mcp"]),
      name: v.pipe(v.string(), v.minLength(1)),
    }),
    status: v.picklist(["queued", "running", "retrying"]),
    poll_after_seconds: integer({ minimum: 0 }),
  }),
  v.looseObject({
    object: v.picklist(["async_task"]),
    id: v.pipe(v.string(), v.minLength(1)),
    status_url: v.pipe(v.string(), v.minLength(1)),
    created_time: v.string(),
    operation: v.looseObject({
      surface: v.picklist(["rest", "mcp"]),
      name: v.pipe(v.string(), v.minLength(1)),
    }),
    status: v.picklist(["succeeded"]),
    result: v.record(
      v.string(),
      v.lazy(() => PublicApiAsyncTaskStatusResultJsonValue),
    ),
  }),
  v.looseObject({
    object: v.picklist(["async_task"]),
    id: v.pipe(v.string(), v.minLength(1)),
    status_url: v.pipe(v.string(), v.minLength(1)),
    created_time: v.string(),
    operation: v.looseObject({
      surface: v.picklist(["rest", "mcp"]),
      name: v.pipe(v.string(), v.minLength(1)),
    }),
    status: v.picklist(["failed"]),
    error: v.union([
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([400])),
        code: v.picklist(["invalid_json"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([400])),
        code: v.picklist(["invalid_request_url"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([400])),
        code: v.picklist(["invalid_request"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([400])),
        code: v.picklist(["missing_version"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([400])),
        code: v.picklist(["invalid_beta"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([400])),
        code: v.picklist(["validation_error"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([401])),
        code: v.picklist(["unauthorized"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([403])),
        code: v.picklist(["restricted_resource"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([404])),
        code: v.picklist(["object_not_found"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([404])),
        code: v.picklist(["directory_not_found"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([429])),
        code: v.picklist(["rate_limited"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([529])),
        code: v.picklist(["service_overload"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([500])),
        code: v.picklist(["internal_server_error"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([503])),
        code: v.picklist(["service_unavailable"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([504])),
        code: v.picklist(["gateway_timeout"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([409])),
        code: v.picklist(["conflict_error"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([409])),
        code: v.picklist(["idempotency_key_reused"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([406])),
        code: v.picklist(["row_limit_exceeded"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([403])),
        code: v.picklist(["status_change_not_allowed"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([409])),
        code: v.picklist(["agent_deleted"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([400])),
        code: v.picklist(["invalid_credit_limit"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([403])),
        code: v.picklist(["workspace_credits_exhausted"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
      v.looseObject({
        object: v.picklist(["error"]),
        status: v.pipe(integer(), v.picklist([403])),
        code: v.picklist(["agent_credit_limit_reached"]),
        message: v.pipe(v.string(), v.minLength(1)),
        additional_data: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())]))),
      }),
    ]),
  }),
])

export const RetrieveABlockResponse: v.GenericSchema<unknown, T.RetrieveABlockResponse> = v.union([
  v.lazy(() => PartialBlockObjectResponse),
  v.lazy(() => BlockObjectResponse),
])

export const UpdateABlockRequest: v.GenericSchema<unknown, T.UpdateABlockRequest> = v.union([
  v.union([
    v.looseObject({
      embed: v.union([
        v.lazy(() => UpdateMediaContentWithUrlAndCaptionRequest),
        v.lazy(() => UpdateEmbedFileUploadRequest),
      ]),
      type: v.optional(v.picklist(["embed"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      bookmark: v.lazy(() => UpdateMediaContentWithUrlAndCaptionRequest),
      type: v.optional(v.picklist(["bookmark"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      image: v.lazy(() => UpdateMediaContentWithFileAndCaptionRequest),
      type: v.optional(v.picklist(["image"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      video: v.lazy(() => UpdateMediaContentWithFileAndCaptionRequest),
      type: v.optional(v.picklist(["video"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      pdf: v.lazy(() => UpdateMediaContentWithFileAndCaptionRequest),
      type: v.optional(v.picklist(["pdf"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      file: v.lazy(() => UpdateMediaContentWithFileNameAndCaptionRequest),
      type: v.optional(v.picklist(["file"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      audio: v.lazy(() => UpdateMediaContentWithFileAndCaptionRequest),
      type: v.optional(v.picklist(["audio"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      code: v.looseObject({
        rich_text: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
        language: v.optional(v.lazy(() => LanguageRequest)),
        caption: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
      }),
      type: v.optional(v.picklist(["code"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      equation: v.lazy(() => ContentWithExpressionRequest),
      type: v.optional(v.picklist(["equation"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      divider: v.lazy(() => EmptyObject),
      type: v.optional(v.picklist(["divider"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      breadcrumb: v.lazy(() => EmptyObject),
      type: v.optional(v.picklist(["breadcrumb"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      tab: v.lazy(() => EmptyObject),
      type: v.optional(v.picklist(["tab"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      table_of_contents: v.looseObject({
        color: v.optional(v.lazy(() => ApiColor)),
      }),
      type: v.optional(v.picklist(["table_of_contents"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      link_to_page: v.union([
        v.looseObject({
          page_id: v.lazy(() => IdRequest),
          type: v.optional(v.picklist(["page_id"])),
        }),
        v.looseObject({
          database_id: v.lazy(() => IdRequest),
          type: v.optional(v.picklist(["database_id"])),
        }),
        v.looseObject({
          comment_id: v.lazy(() => IdRequest),
          type: v.optional(v.picklist(["comment_id"])),
        }),
      ]),
      type: v.optional(v.picklist(["link_to_page"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      table_row: v.lazy(() => ContentWithTableRowRequest),
      type: v.optional(v.picklist(["table_row"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      heading_1: v.lazy(() => HeaderContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["heading_1"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      heading_2: v.lazy(() => HeaderContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["heading_2"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      heading_3: v.lazy(() => HeaderContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["heading_3"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      heading_4: v.lazy(() => HeaderContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["heading_4"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      paragraph: v.lazy(() => ContentWithRichTextColorAndIconUpdateRequest),
      type: v.optional(v.picklist(["paragraph"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      bulleted_list_item: v.lazy(() => ContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["bulleted_list_item"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      numbered_list_item: v.lazy(() => ContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["numbered_list_item"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      quote: v.lazy(() => ContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["quote"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      to_do: v.looseObject({
        rich_text: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
        checked: v.optional(v.boolean()),
        color: v.optional(v.lazy(() => ApiColor)),
      }),
      type: v.optional(v.picklist(["to_do"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      toggle: v.lazy(() => ContentWithRichTextAndColorRequest),
      type: v.optional(v.picklist(["toggle"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      template: v.lazy(() => ContentWithRichTextRequest),
      type: v.optional(v.picklist(["template"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      callout: v.looseObject({
        rich_text: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
        icon: v.optional(v.lazy(() => PageIconRequest)),
        color: v.optional(v.lazy(() => ApiColor)),
      }),
      type: v.optional(v.picklist(["callout"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      synced_block: v.looseObject({
        synced_from: v.nullable(
          v.looseObject({
            block_id: v.lazy(() => IdRequest),
            type: v.optional(v.picklist(["block_id"])),
          }),
        ),
      }),
      type: v.optional(v.picklist(["synced_block"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      table: v.looseObject({
        has_column_header: v.optional(v.boolean()),
        has_row_header: v.optional(v.boolean()),
      }),
      type: v.optional(v.picklist(["table"])),
      in_trash: v.optional(v.boolean()),
    }),
    v.looseObject({
      column: v.looseObject({
        width_ratio: v.optional(number()),
      }),
      type: v.optional(v.picklist(["column"])),
      in_trash: v.optional(v.boolean()),
    }),
  ]),
  v.looseObject({
    in_trash: v.optional(v.boolean()),
  }),
])

export const UpdateABlockResponse: v.GenericSchema<unknown, T.UpdateABlockResponse> = v.union([
  v.lazy(() => PartialBlockObjectResponse),
  v.lazy(() => BlockObjectResponse),
])

export const DeleteABlockResponse: v.GenericSchema<unknown, T.DeleteABlockResponse> = v.union([
  v.lazy(() => PartialBlockObjectResponse),
  v.lazy(() => BlockObjectResponse),
])

export const GetBlockChildrenResponse: v.GenericSchema<unknown, T.GetBlockChildrenResponse> = v.looseObject({
  type: v.picklist(["block"]),
  block: v.lazy(() => EmptyObject),
  object: v.picklist(["list"]),
  next_cursor: v.nullable(v.string()),
  has_more: v.boolean(),
  results: v.array(v.union([v.lazy(() => PartialBlockObjectResponse), v.lazy(() => BlockObjectResponse)])),
})

export const PatchBlockChildrenRequest: v.GenericSchema<unknown, T.PatchBlockChildrenRequest> = v.looseObject({
  children: v.pipe(v.array(v.lazy(() => BlockObjectRequest)), v.maxLength(100)),
  position: v.optional(v.lazy(() => ContentPositionSchema)),
  notifications: v.optional(v.lazy(() => PageWriteNotificationsSchema)),
})

export const PatchBlockChildrenResponse: v.GenericSchema<unknown, T.PatchBlockChildrenResponse> = v.looseObject({
  type: v.picklist(["block"]),
  block: v.lazy(() => EmptyObject),
  object: v.picklist(["list"]),
  next_cursor: v.nullable(v.string()),
  has_more: v.boolean(),
  results: v.array(v.union([v.lazy(() => PartialBlockObjectResponse), v.lazy(() => BlockObjectResponse)])),
})

export const RetrieveADataSourceResponse: v.GenericSchema<unknown, T.RetrieveADataSourceResponse> = v.union([
  v.lazy(() => PartialDataSourceObjectResponse),
  v.lazy(() => DataSourceObjectResponse),
])

export const UpdateADataSourceRequest: v.GenericSchema<unknown, T.UpdateADataSourceRequest> = v.looseObject({
  title: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  icon: v.optional(v.nullable(v.union([v.lazy(() => PageIconRequest)]))),
  properties: v.optional(
    v.record(
      v.string(),
      v.nullable(
        v.union([
          v.union([
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["number"])),
              number: v.looseObject({
                format: v.optional(v.lazy(() => NumberFormat)),
              }),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["formula"])),
              formula: v.looseObject({
                expression: v.optional(v.string()),
              }),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["select"])),
              select: v.looseObject({
                options: v.optional(
                  v.pipe(
                    v.array(
                      v.union([
                        v.looseObject({
                          color: v.optional(v.lazy(() => SelectColor)),
                          description: v.optional(v.nullable(v.union([v.string()]))),
                          name: v.string(),
                          id: v.optional(v.string()),
                        }),
                        v.looseObject({
                          color: v.optional(v.lazy(() => SelectColor)),
                          description: v.optional(v.nullable(v.union([v.string()]))),
                          id: v.string(),
                          name: v.optional(v.string()),
                        }),
                      ]),
                    ),
                    v.maxLength(100),
                  ),
                ),
              }),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["multi_select"])),
              multi_select: v.looseObject({
                options: v.optional(
                  v.pipe(
                    v.array(
                      v.union([
                        v.looseObject({
                          color: v.optional(v.lazy(() => SelectColor)),
                          description: v.optional(v.nullable(v.union([v.string()]))),
                          name: v.string(),
                          id: v.optional(v.string()),
                        }),
                        v.looseObject({
                          color: v.optional(v.lazy(() => SelectColor)),
                          description: v.optional(v.nullable(v.union([v.string()]))),
                          id: v.string(),
                          name: v.optional(v.string()),
                        }),
                      ]),
                    ),
                    v.maxLength(100),
                  ),
                ),
              }),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["status"])),
              status: v.lazy(() => StatusPropertyConfigUpdateRequest),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["relation"])),
              relation: v.union([
                v.looseObject({
                  data_source_id: v.lazy(() => IdRequest),
                  type: v.optional(v.picklist(["single_property"])),
                  single_property: v.lazy(() => EmptyObject),
                }),
                v.looseObject({
                  data_source_id: v.lazy(() => IdRequest),
                  type: v.optional(v.picklist(["dual_property"])),
                  dual_property: v.looseObject({
                    synced_property_id: v.optional(v.string()),
                    synced_property_name: v.optional(v.string()),
                  }),
                }),
              ]),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["rollup"])),
              rollup: v.union([
                v.looseObject({
                  function: v.lazy(() => RollupFunction),
                  relation_property_name: v.string(),
                  rollup_property_name: v.string(),
                }),
                v.looseObject({
                  function: v.lazy(() => RollupFunction),
                  relation_property_id: v.string(),
                  rollup_property_name: v.string(),
                }),
                v.looseObject({
                  function: v.lazy(() => RollupFunction),
                  relation_property_name: v.string(),
                  rollup_property_id: v.string(),
                }),
                v.looseObject({
                  function: v.lazy(() => RollupFunction),
                  relation_property_id: v.string(),
                  rollup_property_id: v.string(),
                }),
              ]),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["unique_id"])),
              unique_id: v.looseObject({
                prefix: v.optional(v.nullable(v.union([v.string()]))),
              }),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["title"])),
              title: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["rich_text"])),
              rich_text: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["url"])),
              url: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["people"])),
              people: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["files"])),
              files: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["email"])),
              email: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["phone_number"])),
              phone_number: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["date"])),
              date: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["checkbox"])),
              checkbox: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["created_by"])),
              created_by: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["created_time"])),
              created_time: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["last_edited_by"])),
              last_edited_by: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["last_edited_time"])),
              last_edited_time: v.lazy(() => EmptyObject),
            }),
            v.looseObject({
              name: v.optional(v.string()),
              description: v.optional(v.nullable(v.union([v.lazy(() => PropertyDescriptionRequest)]))),
              type: v.optional(v.picklist(["place"])),
              place: v.lazy(() => EmptyObject),
            }),
          ]),
          v.looseObject({
            name: v.string(),
          }),
        ]),
      ),
    ),
  ),
  in_trash: v.optional(v.boolean()),
  parent: v.optional(v.lazy(() => ParentOfDataSourceRequest)),
})

export const UpdateADataSourceResponse: v.GenericSchema<unknown, T.UpdateADataSourceResponse> = v.union([
  v.lazy(() => PartialDataSourceObjectResponse),
  v.lazy(() => DataSourceObjectResponse),
])

export const PostDatabaseQueryRequest: v.GenericSchema<unknown, T.PostDatabaseQueryRequest> = v.looseObject({
  sorts: v.optional(v.array(v.lazy(() => ViewSortRequest))),
  filter: v.optional(v.lazy(() => ViewFilterRequest)),
  start_cursor: v.optional(v.string()),
  page_size: v.optional(integer({ minimum: 1 })),
  is_archived: v.optional(v.boolean()),
  result_type: v.optional(v.picklist(["page", "data_source"])),
})

export const CreateADatabaseRequest: v.GenericSchema<unknown, T.CreateADatabaseRequest> = v.looseObject({
  parent: v.lazy(() => ParentOfDataSourceRequest),
  properties: v.record(
    v.string(),
    v.lazy(() => PropertyConfigurationRequest),
  ),
  title: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  icon: v.optional(v.nullable(v.union([v.lazy(() => PageIconRequest)]))),
})

export const CreateADatabaseResponse: v.GenericSchema<unknown, T.CreateADatabaseResponse> = v.union([
  v.lazy(() => PartialDataSourceObjectResponse),
  v.lazy(() => DataSourceObjectResponse),
])

export const ListDataSourceTemplatesResponse: v.GenericSchema<unknown, T.ListDataSourceTemplatesResponse> =
  v.looseObject({
    templates: v.pipe(
      v.array(
        v.looseObject({
          id: v.lazy(() => IdResponse),
          name: v.string(),
          is_default: v.boolean(),
        }),
      ),
      v.maxLength(100),
    ),
    has_more: v.boolean(),
    next_cursor: v.nullable(v.union([v.lazy(() => IdResponse)])),
  })

export const RetrieveDatabaseResponse: v.GenericSchema<unknown, T.RetrieveDatabaseResponse> = v.union([
  v.lazy(() => PartialDatabaseObjectResponse),
  v.lazy(() => DatabaseObjectResponse),
])

export const UpdateDatabaseRequest: v.GenericSchema<unknown, T.UpdateDatabaseRequest> = v.looseObject({
  parent: v.optional(
    v.union([
      v.looseObject({
        type: v.picklist(["page_id"]),
        page_id: v.lazy(() => IdRequest),
      }),
      v.looseObject({
        type: v.picklist(["workspace"]),
        workspace: v.literal(true),
      }),
    ]),
  ),
  title: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  description: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  is_inline: v.optional(v.boolean()),
  icon: v.optional(v.lazy(() => PageIconRequest)),
  cover: v.optional(v.lazy(() => PageCoverRequest)),
  in_trash: v.optional(v.boolean()),
  is_locked: v.optional(v.boolean()),
  show_data_source_title: v.optional(v.boolean()),
})

export const UpdateDatabaseResponse: v.GenericSchema<unknown, T.UpdateDatabaseResponse> = v.union([
  v.lazy(() => PartialDatabaseObjectResponse),
  v.lazy(() => DatabaseObjectResponse),
])

export const CreateDatabaseRequest: v.GenericSchema<unknown, T.CreateDatabaseRequest> = v.looseObject({
  parent: v.union([
    v.looseObject({
      type: v.picklist(["page_id"]),
      page_id: v.lazy(() => IdRequest),
    }),
    v.looseObject({
      type: v.picklist(["workspace"]),
      workspace: v.literal(true),
    }),
  ]),
  title: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  description: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100))),
  is_inline: v.optional(v.boolean()),
  initial_data_source: v.optional(v.lazy(() => InitialDataSourceRequest)),
  database_type: v.optional(v.picklist(["tasks", "projects", "skills"])),
  icon: v.optional(v.lazy(() => PageIconRequest)),
  cover: v.optional(v.lazy(() => PageCoverRequest)),
  show_data_source_title: v.optional(v.boolean()),
})

export const CreateDatabaseResponse: v.GenericSchema<unknown, T.CreateDatabaseResponse> = v.union([
  v.lazy(() => PartialDatabaseObjectResponse),
  v.lazy(() => DatabaseObjectResponse),
])

export const PostSearchRequest: v.GenericSchema<unknown, T.PostSearchRequest> = v.looseObject({
  sort: v.optional(
    v.union([
      v.looseObject({
        timestamp: v.picklist(["last_edited_time"]),
        direction: v.picklist(["ascending", "descending"]),
      }),
      v.looseObject({
        property: v.picklist(["relevance"]),
      }),
    ]),
  ),
  query: v.optional(v.string()),
  start_cursor: v.optional(v.string()),
  page_size: v.optional(number()),
  filter: v.optional(
    v.union([
      v.looseObject({
        property: v.picklist(["object"]),
        value: v.picklist(["page", "data_source"]),
        in_trash: v.optional(v.boolean()),
      }),
      v.looseObject({
        in_trash: v.boolean(),
      }),
    ]),
  ),
})

export const ListCommentsResponse: v.GenericSchema<unknown, T.ListCommentsResponse> = v.looseObject({
  object: v.picklist(["list"]),
  next_cursor: v.nullable(v.union([v.lazy(() => IdResponse)])),
  has_more: v.boolean(),
  results: v.array(v.lazy(() => CommentObjectResponse)),
  type: v.picklist(["comment"]),
  comment: v.lazy(() => EmptyObject),
  request_status: v.optional(v.lazy(() => RequestStatusResponse)),
})

export const CreateACommentRequest: v.GenericSchema<unknown, T.CreateACommentRequest> = v.union([
  v.looseObject({
    attachments: v.optional(
      v.pipe(
        v.array(
          v.looseObject({
            file_upload_id: v.string(),
            type: v.optional(v.picklist(["file_upload"])),
          }),
        ),
        v.maxLength(3),
      ),
    ),
    display_name: v.optional(
      v.union([
        v.looseObject({
          type: v.picklist(["integration"]),
        }),
        v.looseObject({
          type: v.picklist(["user"]),
        }),
        v.looseObject({
          type: v.picklist(["custom"]),
          custom: v.looseObject({
            name: v.pipe(v.string(), v.minLength(1)),
          }),
        }),
      ]),
    ),
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    parent: v.union([
      v.looseObject({
        page_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["page_id"])),
      }),
      v.looseObject({
        block_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["block_id"])),
      }),
    ]),
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
  }),
  v.looseObject({
    attachments: v.optional(
      v.pipe(
        v.array(
          v.looseObject({
            file_upload_id: v.string(),
            type: v.optional(v.picklist(["file_upload"])),
          }),
        ),
        v.maxLength(3),
      ),
    ),
    display_name: v.optional(
      v.union([
        v.looseObject({
          type: v.picklist(["integration"]),
        }),
        v.looseObject({
          type: v.picklist(["user"]),
        }),
        v.looseObject({
          type: v.picklist(["custom"]),
          custom: v.looseObject({
            name: v.pipe(v.string(), v.minLength(1)),
          }),
        }),
      ]),
    ),
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    parent: v.union([
      v.looseObject({
        page_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["page_id"])),
      }),
      v.looseObject({
        block_id: v.lazy(() => IdRequest),
        type: v.optional(v.picklist(["block_id"])),
      }),
    ]),
    markdown: v.string(),
  }),
  v.looseObject({
    attachments: v.optional(
      v.pipe(
        v.array(
          v.looseObject({
            file_upload_id: v.string(),
            type: v.optional(v.picklist(["file_upload"])),
          }),
        ),
        v.maxLength(3),
      ),
    ),
    display_name: v.optional(
      v.union([
        v.looseObject({
          type: v.picklist(["integration"]),
        }),
        v.looseObject({
          type: v.picklist(["user"]),
        }),
        v.looseObject({
          type: v.picklist(["custom"]),
          custom: v.looseObject({
            name: v.pipe(v.string(), v.minLength(1)),
          }),
        }),
      ]),
    ),
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    discussion_id: v.lazy(() => IdRequest),
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
  }),
  v.looseObject({
    attachments: v.optional(
      v.pipe(
        v.array(
          v.looseObject({
            file_upload_id: v.string(),
            type: v.optional(v.picklist(["file_upload"])),
          }),
        ),
        v.maxLength(3),
      ),
    ),
    display_name: v.optional(
      v.union([
        v.looseObject({
          type: v.picklist(["integration"]),
        }),
        v.looseObject({
          type: v.picklist(["user"]),
        }),
        v.looseObject({
          type: v.picklist(["custom"]),
          custom: v.looseObject({
            name: v.pipe(v.string(), v.minLength(1)),
          }),
        }),
      ]),
    ),
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    discussion_id: v.lazy(() => IdRequest),
    markdown: v.string(),
  }),
])

export const CreateACommentResponse: v.GenericSchema<unknown, T.CreateACommentResponse> = v.union([
  v.lazy(() => PartialCommentObjectResponse),
  v.lazy(() => CommentObjectResponse),
])

export const RetrieveCommentResponse: v.GenericSchema<unknown, T.RetrieveCommentResponse> = v.union([
  v.lazy(() => PartialCommentObjectResponse),
  v.lazy(() => CommentObjectResponse),
])

export const UpdateACommentRequest: v.GenericSchema<unknown, T.UpdateACommentRequest> = v.union([
  v.looseObject({
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    rich_text: v.pipe(v.array(v.lazy(() => RichTextItemRequest)), v.maxLength(100)),
  }),
  v.looseObject({
    markdown_version: v.optional(v.picklist(["v1", "v2"])),
    markdown: v.string(),
  }),
])

export const UpdateACommentResponse: v.GenericSchema<unknown, T.UpdateACommentResponse> = v.union([
  v.lazy(() => PartialCommentObjectResponse),
  v.lazy(() => CommentObjectResponse),
])

export const DeleteACommentResponse: v.GenericSchema<unknown, T.DeleteACommentResponse> = v.union([
  v.lazy(() => PartialCommentObjectResponse),
  v.lazy(() => CommentObjectResponse),
])

export const ListFileUploadsResponse: v.GenericSchema<unknown, T.ListFileUploadsResponse> = v.looseObject({
  object: v.picklist(["list"]),
  next_cursor: v.nullable(v.union([v.lazy(() => IdResponse)])),
  has_more: v.boolean(),
  results: v.array(v.lazy(() => FileUploadObjectResponse)),
  type: v.picklist(["file_upload"]),
  file_upload: v.lazy(() => EmptyObject),
  request_status: v.optional(v.lazy(() => RequestStatusResponse)),
})

export const CreateFileRequest: v.GenericSchema<unknown, T.CreateFileRequest> = v.looseObject({
  mode: v.optional(v.picklist(["single_part", "multi_part", "external_url"])),
  filename: v.optional(v.string()),
  content_type: v.optional(v.string()),
  number_of_parts: v.optional(integer({ minimum: 1, maximum: 10000 })),
  external_url: v.optional(v.string()),
})

export const ListCustomEmojisResponse: v.GenericSchema<unknown, T.ListCustomEmojisResponse> = v.looseObject({
  object: v.picklist(["list"]),
  type: v.picklist(["custom_emoji"]),
  results: v.pipe(v.array(v.lazy(() => CustomEmojiResponse)), v.maxLength(100)),
  has_more: v.boolean(),
  next_cursor: v.nullable(v.union([v.lazy(() => IdResponse)])),
})

export const ListViewsResponse: v.GenericSchema<unknown, T.ListViewsResponse> = v.looseObject({
  object: v.picklist(["list"]),
  next_cursor: v.nullable(v.union([v.lazy(() => IdResponse)])),
  has_more: v.boolean(),
  results: v.array(v.lazy(() => DataSourceViewReferenceResponse)),
  type: v.picklist(["view"]),
  view: v.lazy(() => EmptyObject),
  request_status: v.optional(v.lazy(() => RequestStatusResponse)),
})

export const CreateViewResponse: v.GenericSchema<unknown, T.CreateViewResponse> = v.union([
  v.lazy(() => PartialDataSourceViewObjectResponse),
  v.lazy(() => DataSourceViewObjectResponse),
])

export const RetrieveAViewResponse: v.GenericSchema<unknown, T.RetrieveAViewResponse> = v.union([
  v.lazy(() => PartialDataSourceViewObjectResponse),
  v.lazy(() => DataSourceViewObjectResponse),
])

export const UpdateAViewResponse: v.GenericSchema<unknown, T.UpdateAViewResponse> = v.union([
  v.lazy(() => PartialDataSourceViewObjectResponse),
  v.lazy(() => DataSourceViewObjectResponse),
])

export const GetViewQueryResultsResponse: v.GenericSchema<unknown, T.GetViewQueryResultsResponse> = v.looseObject({
  object: v.picklist(["list"]),
  next_cursor: v.nullable(v.union([v.lazy(() => IdResponse)])),
  has_more: v.boolean(),
  results: v.array(v.lazy(() => PartialPageObjectResponse)),
  type: v.picklist(["page"]),
  page: v.lazy(() => EmptyObject),
  request_status: v.optional(v.lazy(() => RequestStatusResponse)),
})

export const CreateMeetingNoteRequest: v.GenericSchema<unknown, T.CreateMeetingNoteRequest> = v.union([
  v.looseObject({
    title: v.optional(v.pipe(v.string(), v.maxLength(2000))),
    language: v.optional(
      v.picklist([
        "auto",
        "en",
        "zh-CN",
        "zh-TW",
        "es",
        "fr",
        "de",
        "ja",
        "ko",
        "pt",
        "ru",
        "th",
        "vi",
        "id",
        "da",
        "fi",
        "no",
        "nl",
        "it",
        "sv",
        "ar",
        "he",
        "pl",
      ]),
    ),
    options: v.optional(
      v.looseObject({
        kickoff_summary: v.optional(v.boolean()),
      }),
    ),
    source: v.looseObject({
      type: v.picklist(["file_upload"]),
      file_upload_id: v.lazy(() => IdRequest),
    }),
    parent: v.looseObject({
      type: v.picklist(["page_id"]),
      page_id: v.lazy(() => IdRequest),
    }),
  }),
  v.looseObject({
    title: v.optional(v.pipe(v.string(), v.maxLength(2000))),
    language: v.optional(
      v.picklist([
        "auto",
        "en",
        "zh-CN",
        "zh-TW",
        "es",
        "fr",
        "de",
        "ja",
        "ko",
        "pt",
        "ru",
        "th",
        "vi",
        "id",
        "da",
        "fi",
        "no",
        "nl",
        "it",
        "sv",
        "ar",
        "he",
        "pl",
      ]),
    ),
    options: v.optional(
      v.looseObject({
        kickoff_summary: v.optional(v.boolean()),
      }),
    ),
    source: v.looseObject({
      type: v.picklist(["block"]),
      block_id: v.lazy(() => IdRequest),
    }),
    parent: v.optional(v.unknown()),
  }),
])

export const CreateMeetingNoteResponse: v.GenericSchema<unknown, T.CreateMeetingNoteResponse> = v.union([
  v.looseObject({
    object: v.picklist(["block"]),
    id: v.lazy(() => IdResponse),
  }),
  v.looseObject({
    object: v.picklist(["block"]),
    id: v.lazy(() => IdResponse),
    type: v.picklist(["meeting_notes"]),
    meeting_notes: v.looseObject({
      is_full_page: v.boolean(),
      title: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100))),
      status: v.optional(
        v.picklist([
          "transcription_not_started",
          "transcription_paused",
          "transcription_in_progress",
          "transcription_failed",
          "summary_in_progress",
          "notes_ready",
        ]),
      ),
      children: v.optional(
        v.looseObject({
          summary_block_id: v.optional(v.lazy(() => IdResponse)),
          notes_block_id: v.optional(v.lazy(() => IdResponse)),
          transcript_block_id: v.optional(v.lazy(() => IdResponse)),
        }),
      ),
      calendar_event: v.optional(
        v.looseObject({
          start_time: v.string(),
          end_time: v.string(),
          event_id: v.optional(v.string()),
          attendees: v.optional(v.pipe(v.array(v.lazy(() => IdResponse)), v.maxLength(100))),
        }),
      ),
      recording: v.optional(
        v.looseObject({
          start_time: v.optional(v.string()),
          end_time: v.optional(v.string()),
        }),
      ),
    }),
    created_time: v.string(),
    last_edited_time: v.string(),
    created_by: v.lazy(() => PartialUserObjectResponse),
    last_edited_by: v.lazy(() => PartialUserObjectResponse),
    has_children: v.boolean(),
    in_trash: v.boolean(),
  }),
])

export const QueryMeetingNotesRequest: v.GenericSchema<unknown, T.QueryMeetingNotesRequest> = v.looseObject({
  filter: v.optional(
    v.looseObject({
      operator: v.picklist(["and", "or"]),
      filters: v.optional(
        v.pipe(
          v.array(
            v.union([
              v.lazy(() => MeetingNotesPropertyFilter),
              v.looseObject({
                operator: v.picklist(["and", "or"]),
                filters: v.pipe(v.array(v.lazy(() => MeetingNotesPropertyFilter)), v.maxLength(100)),
              }),
            ]),
          ),
          v.maxLength(100),
        ),
      ),
    }),
  ),
  sort: v.optional(
    v.pipe(
      v.array(
        v.looseObject({
          property: v.picklist([
            "title",
            "attendees",
            "created_time",
            "created_by",
            "last_edited_time",
            "last_edited_by",
          ]),
          direction: v.picklist(["ascending", "descending"]),
        }),
      ),
      v.maxLength(100),
    ),
  ),
  limit: v.optional(integer({ minimum: 1, maximum: 50 })),
})

export const QueryMeetingNotesResponse: v.GenericSchema<unknown, T.QueryMeetingNotesResponse> = v.looseObject({
  results: v.pipe(
    v.array(
      v.looseObject({
        object: v.picklist(["block"]),
        id: v.lazy(() => IdResponse),
        type: v.picklist(["meeting_notes"]),
        meeting_notes: v.looseObject({
          is_full_page: v.boolean(),
          title: v.optional(v.pipe(v.array(v.lazy(() => RichTextItemResponse)), v.maxLength(100))),
          status: v.optional(
            v.picklist([
              "transcription_not_started",
              "transcription_paused",
              "transcription_in_progress",
              "transcription_failed",
              "summary_in_progress",
              "notes_ready",
            ]),
          ),
          children: v.optional(
            v.looseObject({
              summary_block_id: v.optional(v.lazy(() => IdResponse)),
              notes_block_id: v.optional(v.lazy(() => IdResponse)),
              transcript_block_id: v.optional(v.lazy(() => IdResponse)),
            }),
          ),
          calendar_event: v.optional(
            v.looseObject({
              start_time: v.string(),
              end_time: v.string(),
              event_id: v.optional(v.string()),
              attendees: v.optional(v.pipe(v.array(v.lazy(() => IdResponse)), v.maxLength(100))),
            }),
          ),
          recording: v.optional(
            v.looseObject({
              start_time: v.optional(v.string()),
              end_time: v.optional(v.string()),
            }),
          ),
        }),
        created_time: v.string(),
        last_edited_time: v.string(),
        created_by: v.lazy(() => PartialUserObjectResponse),
        last_edited_by: v.lazy(() => PartialUserObjectResponse),
        has_children: v.boolean(),
        in_trash: v.boolean(),
      }),
    ),
    v.maxLength(100),
  ),
  has_more: v.boolean(),
})

export const QueryAgentsRequest: v.GenericSchema<unknown, T.QueryAgentsRequest> = v.looseObject({
  query: v.optional(v.string()),
  filter: v.optional(
    v.union([
      v.union([
        v.looseObject({
          property: v.picklist(["id"]),
          id: v.looseObject({
            equals: v.string(),
          }),
        }),
        v.looseObject({
          property: v.picklist(["agent_type"]),
          string: v.looseObject({
            equals: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent"]),
          }),
        }),
        v.looseObject({
          property: v.picklist(["created_by"]),
          people: v.looseObject({
            contains: v.string(),
          }),
        }),
        v.looseObject({
          property: v.picklist(["created_time"]),
          date: v.looseObject({
            after: v.optional(v.string()),
            before: v.optional(v.string()),
          }),
        }),
        v.looseObject({
          property: v.picklist(["favorited"]),
          checkbox: v.looseObject({
            equals: v.boolean(),
          }),
        }),
        v.looseObject({
          property: v.picklist(["connections"]),
          mcp_server: v.looseObject({
            contains: v.string(),
          }),
        }),
        v.looseObject({
          property: v.picklist(["status"]),
          status: v.looseObject({
            in: v.pipe(v.array(v.picklist(["active", "disabled", "deleted"])), v.minLength(1)),
          }),
        }),
        v.looseObject({
          property: v.picklist(["model_mode"]),
          select: v.looseObject({
            equals: v.picklist(["auto", "pinned"]),
          }),
        }),
        v.looseObject({
          property: v.picklist(["agent_version"]),
          number: v.looseObject({
            equals: integer({ minimum: 1 }),
          }),
        }),
        v.looseObject({
          property: v.picklist(["last_run_at"]),
          date: v.looseObject({
            after: v.optional(v.string()),
            before: v.optional(v.string()),
          }),
        }),
      ]),
      v.union([
        v.looseObject({
          and: v.pipe(
            v.array(
              v.union([
                v.union([
                  v.looseObject({
                    property: v.picklist(["id"]),
                    id: v.looseObject({
                      equals: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["agent_type"]),
                    string: v.looseObject({
                      equals: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent"]),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["created_by"]),
                    people: v.looseObject({
                      contains: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["created_time"]),
                    date: v.looseObject({
                      after: v.optional(v.string()),
                      before: v.optional(v.string()),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["favorited"]),
                    checkbox: v.looseObject({
                      equals: v.boolean(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["connections"]),
                    mcp_server: v.looseObject({
                      contains: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["status"]),
                    status: v.looseObject({
                      in: v.pipe(v.array(v.picklist(["active", "disabled", "deleted"])), v.minLength(1)),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["model_mode"]),
                    select: v.looseObject({
                      equals: v.picklist(["auto", "pinned"]),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["agent_version"]),
                    number: v.looseObject({
                      equals: integer({ minimum: 1 }),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["last_run_at"]),
                    date: v.looseObject({
                      after: v.optional(v.string()),
                      before: v.optional(v.string()),
                    }),
                  }),
                ]),
                v.union([
                  v.looseObject({
                    and: v.pipe(
                      v.array(
                        v.union([
                          v.looseObject({
                            property: v.picklist(["id"]),
                            id: v.looseObject({
                              equals: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["agent_type"]),
                            string: v.looseObject({
                              equals: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent"]),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["created_by"]),
                            people: v.looseObject({
                              contains: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["created_time"]),
                            date: v.looseObject({
                              after: v.optional(v.string()),
                              before: v.optional(v.string()),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["favorited"]),
                            checkbox: v.looseObject({
                              equals: v.boolean(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["connections"]),
                            mcp_server: v.looseObject({
                              contains: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["status"]),
                            status: v.looseObject({
                              in: v.pipe(v.array(v.picklist(["active", "disabled", "deleted"])), v.minLength(1)),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["model_mode"]),
                            select: v.looseObject({
                              equals: v.picklist(["auto", "pinned"]),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["agent_version"]),
                            number: v.looseObject({
                              equals: integer({ minimum: 1 }),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["last_run_at"]),
                            date: v.looseObject({
                              after: v.optional(v.string()),
                              before: v.optional(v.string()),
                            }),
                          }),
                        ]),
                      ),
                      v.minLength(1),
                    ),
                  }),
                  v.looseObject({
                    or: v.pipe(
                      v.array(
                        v.union([
                          v.looseObject({
                            property: v.picklist(["id"]),
                            id: v.looseObject({
                              equals: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["agent_type"]),
                            string: v.looseObject({
                              equals: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent"]),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["created_by"]),
                            people: v.looseObject({
                              contains: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["created_time"]),
                            date: v.looseObject({
                              after: v.optional(v.string()),
                              before: v.optional(v.string()),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["favorited"]),
                            checkbox: v.looseObject({
                              equals: v.boolean(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["connections"]),
                            mcp_server: v.looseObject({
                              contains: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["status"]),
                            status: v.looseObject({
                              in: v.pipe(v.array(v.picklist(["active", "disabled", "deleted"])), v.minLength(1)),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["model_mode"]),
                            select: v.looseObject({
                              equals: v.picklist(["auto", "pinned"]),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["agent_version"]),
                            number: v.looseObject({
                              equals: integer({ minimum: 1 }),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["last_run_at"]),
                            date: v.looseObject({
                              after: v.optional(v.string()),
                              before: v.optional(v.string()),
                            }),
                          }),
                        ]),
                      ),
                      v.minLength(1),
                    ),
                  }),
                ]),
              ]),
            ),
            v.minLength(1),
          ),
        }),
        v.looseObject({
          or: v.pipe(
            v.array(
              v.union([
                v.union([
                  v.looseObject({
                    property: v.picklist(["id"]),
                    id: v.looseObject({
                      equals: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["agent_type"]),
                    string: v.looseObject({
                      equals: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent"]),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["created_by"]),
                    people: v.looseObject({
                      contains: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["created_time"]),
                    date: v.looseObject({
                      after: v.optional(v.string()),
                      before: v.optional(v.string()),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["favorited"]),
                    checkbox: v.looseObject({
                      equals: v.boolean(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["connections"]),
                    mcp_server: v.looseObject({
                      contains: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["status"]),
                    status: v.looseObject({
                      in: v.pipe(v.array(v.picklist(["active", "disabled", "deleted"])), v.minLength(1)),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["model_mode"]),
                    select: v.looseObject({
                      equals: v.picklist(["auto", "pinned"]),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["agent_version"]),
                    number: v.looseObject({
                      equals: integer({ minimum: 1 }),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["last_run_at"]),
                    date: v.looseObject({
                      after: v.optional(v.string()),
                      before: v.optional(v.string()),
                    }),
                  }),
                ]),
                v.union([
                  v.looseObject({
                    and: v.pipe(
                      v.array(
                        v.union([
                          v.looseObject({
                            property: v.picklist(["id"]),
                            id: v.looseObject({
                              equals: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["agent_type"]),
                            string: v.looseObject({
                              equals: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent"]),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["created_by"]),
                            people: v.looseObject({
                              contains: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["created_time"]),
                            date: v.looseObject({
                              after: v.optional(v.string()),
                              before: v.optional(v.string()),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["favorited"]),
                            checkbox: v.looseObject({
                              equals: v.boolean(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["connections"]),
                            mcp_server: v.looseObject({
                              contains: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["status"]),
                            status: v.looseObject({
                              in: v.pipe(v.array(v.picklist(["active", "disabled", "deleted"])), v.minLength(1)),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["model_mode"]),
                            select: v.looseObject({
                              equals: v.picklist(["auto", "pinned"]),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["agent_version"]),
                            number: v.looseObject({
                              equals: integer({ minimum: 1 }),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["last_run_at"]),
                            date: v.looseObject({
                              after: v.optional(v.string()),
                              before: v.optional(v.string()),
                            }),
                          }),
                        ]),
                      ),
                      v.minLength(1),
                    ),
                  }),
                  v.looseObject({
                    or: v.pipe(
                      v.array(
                        v.union([
                          v.looseObject({
                            property: v.picklist(["id"]),
                            id: v.looseObject({
                              equals: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["agent_type"]),
                            string: v.looseObject({
                              equals: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent"]),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["created_by"]),
                            people: v.looseObject({
                              contains: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["created_time"]),
                            date: v.looseObject({
                              after: v.optional(v.string()),
                              before: v.optional(v.string()),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["favorited"]),
                            checkbox: v.looseObject({
                              equals: v.boolean(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["connections"]),
                            mcp_server: v.looseObject({
                              contains: v.string(),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["status"]),
                            status: v.looseObject({
                              in: v.pipe(v.array(v.picklist(["active", "disabled", "deleted"])), v.minLength(1)),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["model_mode"]),
                            select: v.looseObject({
                              equals: v.picklist(["auto", "pinned"]),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["agent_version"]),
                            number: v.looseObject({
                              equals: integer({ minimum: 1 }),
                            }),
                          }),
                          v.looseObject({
                            property: v.picklist(["last_run_at"]),
                            date: v.looseObject({
                              after: v.optional(v.string()),
                              before: v.optional(v.string()),
                            }),
                          }),
                        ]),
                      ),
                      v.minLength(1),
                    ),
                  }),
                ]),
              ]),
            ),
            v.minLength(1),
          ),
        }),
      ]),
    ]),
  ),
  sorts: v.optional(
    v.pipe(
      v.array(
        v.looseObject({
          property: v.picklist(["created_time", "last_run_at"]),
          direction: v.picklist(["ascending", "descending"]),
        }),
      ),
      v.minLength(1),
      v.maxLength(2),
    ),
  ),
  start_cursor: v.optional(v.string()),
  page_size: v.optional(integer({ minimum: 1, maximum: 100 })),
  verbose: v.optional(v.boolean()),
  include_deleted: v.optional(v.boolean()),
})

export const QueryAgentsResponse: v.GenericSchema<unknown, T.QueryAgentsResponse> = v.looseObject({
  object: v.picklist(["list"]),
  type: v.picklist(["agent"]),
  results: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          object: v.picklist(["agent"]),
          id: v.lazy(() => IdResponse),
          agent_type: v.picklist(["custom_agent", "autofill_custom_agent"]),
          name: v.string(),
          description: v.nullable(v.union([v.string()])),
          instructions_page_id: v.nullable(v.union([v.lazy(() => IdResponse)])),
          icon: v.nullable(
            v.union([
              v.lazy(() => PageIconResponse),
              v.looseObject({
                type: v.picklist(["custom_agent_avatar"]),
                custom_agent_avatar: v.looseObject({
                  static_url: v.string(),
                  animated_url: v.string(),
                }),
              }),
            ]),
          ),
          model: v.union([
            v.looseObject({
              mode: v.picklist(["auto"]),
            }),
            v.looseObject({
              mode: v.picklist(["pinned"]),
              id: v.nullable(v.union([v.string()])),
            }),
          ]),
          connections: v.pipe(
            v.array(
              v.union([
                v.looseObject({
                  type: v.picklist(["notion"]),
                  name: v.string(),
                  account: v.unknown(),
                  permissions: v.pipe(
                    v.array(
                      v.looseObject({
                        target: v.union([
                          v.looseObject({
                            type: v.picklist(["page"]),
                            id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["database_property"]),
                            data_source_id: v.string(),
                            property_id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["agent"]),
                            id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["workspace"]),
                          }),
                          v.looseObject({
                            type: v.picklist(["owner_private_pages"]),
                          }),
                          v.looseObject({
                            type: v.picklist(["web_search"]),
                            allowed_domains: v.nullable(v.union([v.pipe(v.array(v.string()), v.maxLength(100))])),
                          }),
                          v.looseObject({
                            type: v.picklist(["notion_help_docs_search"]),
                          }),
                        ]),
                        scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
                      }),
                    ),
                    v.maxLength(100),
                  ),
                }),
                v.looseObject({
                  type: v.picklist(["slack"]),
                  name: v.string(),
                  account: v.nullable(
                    v.union([
                      v.looseObject({
                        type: v.picklist(["slack_workspace"]),
                        team_id: v.string(),
                      }),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  permissions: v.pipe(
                    v.array(
                      v.looseObject({
                        target: v.union([
                          v.looseObject({
                            type: v.picklist(["slack_channel"]),
                            id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["slack_all_public_channels"]),
                          }),
                          v.looseObject({
                            type: v.picklist(["slack_all_channels"]),
                          }),
                        ]),
                        scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
                      }),
                    ),
                    v.maxLength(100),
                  ),
                }),
                v.looseObject({
                  type: v.picklist(["discord"]),
                  name: v.string(),
                  account: v.nullable(
                    v.union([
                      v.looseObject({
                        type: v.picklist(["discord_server"]),
                        id: v.string(),
                      }),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  permissions: v.pipe(
                    v.array(
                      v.looseObject({
                        target: v.union([
                          v.looseObject({
                            type: v.picklist(["discord_channel"]),
                            id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["discord_all_channels"]),
                          }),
                        ]),
                        scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
                      }),
                    ),
                    v.maxLength(100),
                  ),
                }),
                v.looseObject({
                  type: v.picklist(["mcp_server"]),
                  name: v.string(),
                  account: v.nullable(
                    v.union([
                      v.looseObject({
                        type: v.picklist(["mcp_server"]),
                        server_host: v.string(),
                      }),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  enabled_tools: v.nullable(
                    v.union([
                      v.pipe(
                        v.array(
                          v.looseObject({
                            name: v.string(),
                            title: v.nullable(v.union([v.string()])),
                          }),
                        ),
                        v.maxLength(100),
                      ),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  run_tools_automatically: v.looseObject({
                    read: v.boolean(),
                    write: v.boolean(),
                  }),
                }),
                v.looseObject({
                  type: v.picklist(["custom_mcp_server"]),
                  name: v.string(),
                  account: v.nullable(
                    v.union([
                      v.looseObject({
                        type: v.picklist(["mcp_server"]),
                        server_host: v.string(),
                      }),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  enabled_tools: v.nullable(
                    v.union([
                      v.pipe(
                        v.array(
                          v.looseObject({
                            name: v.string(),
                            title: v.nullable(v.union([v.string()])),
                          }),
                        ),
                        v.maxLength(100),
                      ),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  run_tools_automatically: v.looseObject({
                    read: v.boolean(),
                    write: v.boolean(),
                  }),
                }),
                v.looseObject({
                  type: v.picklist([
                    "asana",
                    "box",
                    "calendar",
                    "computer",
                    "confluence",
                    "cursor",
                    "feedback",
                    "files",
                    "fs",
                    "github",
                    "gmail",
                    "google_calendar",
                    "google_drive",
                    "google_drive_oauth",
                    "gtm",
                    "helpdocs",
                    "images",
                    "jira",
                    "linear",
                    "mail",
                    "marketplace",
                    "memory",
                    "microsoft_teams",
                    "microsoft_teams_oauth",
                    "outlook",
                    "salesforce",
                    "search",
                    "security",
                    "sharepoint",
                    "sharepoint_oauth",
                    "shopify",
                    "skills",
                    "system",
                    "test",
                    "web",
                    "webhooks",
                    "worker",
                    "workers",
                  ]),
                  name: v.string(),
                  account: v.nullable(v.union([v.string()])),
                  permissions: v.pipe(
                    v.array(
                      v.looseObject({
                        target: v.looseObject({
                          type: v.string(),
                          id: v.string(),
                        }),
                        scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
                      }),
                    ),
                    v.maxLength(100),
                  ),
                }),
              ]),
            ),
            v.maxLength(100),
          ),
          status: v.picklist(["active", "disabled", "deleted"]),
          pause_reason: v.nullable(
            v.union([
              v.picklist([
                "run_limit",
                "credit_limit",
                "runaway_credit_usage",
                "workspace_credit_limit",
                "owner_allowance_limit",
                "failure_limit",
                "mark_session_failed_autopause",
                "disabled_from_workspace_settings",
                "disabled_from_workspace_settings_but_resumable",
                "disabled_from_api",
                "disabled_from_agent_settings",
                "disabled_due_to_no_members_with_access",
                "disabled_due_to_lack_of_editors",
                "disabled_by_notion",
                "internal_error",
                "needs_user_review",
                "tool_unavailable",
              ]),
            ]),
          ),
          created_by: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["user", "bot"]),
                id: v.lazy(() => IdResponse),
              }),
            ]),
          ),
          agent_version: v.nullable(
            v.union([
              v.looseObject({
                id: v.lazy(() => IdResponse),
                number: number(),
                published_at: v.string(),
              }),
            ]),
          ),
          created_time: v.string(),
          last_edited_time: v.string(),
          last_run_at: v.nullable(
            v.union([v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}T/)), v.picklist(["hidden"])]),
          ),
          credit_limit: v.nullable(v.union([integer({ minimum: 0 }), v.picklist(["hidden"])])),
          triggers: v.pipe(
            v.array(
              v.looseObject({
                type: v.string(),
                enabled: v.boolean(),
                schedule: v.optional(
                  v.looseObject({
                    frequency: v.string(),
                    interval: integer({ minimum: 1 }),
                    weekdays: v.optional(v.pipe(v.array(v.string()), v.maxLength(100))),
                    monthdays: v.optional(v.pipe(v.array(integer({ minimum: 1 })), v.maxLength(100))),
                    week_numbers: v.optional(v.pipe(v.array(integer()), v.maxLength(100))),
                    hour: v.optional(integer({ minimum: 0 })),
                    minute: v.optional(integer({ minimum: 0 })),
                    timezone: v.optional(v.string()),
                    start_date: v.optional(v.string()),
                    end: v.optional(
                      v.union([
                        v.looseObject({
                          type: v.picklist(["date"]),
                          end_at: v.string(),
                        }),
                        v.looseObject({
                          type: v.picklist(["count"]),
                          occurrences: integer({ minimum: 0 }),
                        }),
                      ]),
                    ),
                  }),
                ),
                config: v.optional(v.record(v.string(), v.unknown())),
              }),
            ),
            v.maxLength(100),
          ),
          instructions: v.optional(v.nullable(v.union([v.string()]))),
        }),
        v.looseObject({
          object: v.picklist(["agent"]),
          id: v.picklist(["notion_ai"]),
          agent_type: v.picklist(["notion_ai"]),
          name: v.string(),
          description: v.unknown(),
          instructions_page_id: v.unknown(),
          icon: v.union([
            v.lazy(() => PageIconResponse),
            v.looseObject({
              type: v.picklist(["custom_agent_avatar"]),
              custom_agent_avatar: v.looseObject({
                static_url: v.string(),
                animated_url: v.string(),
              }),
            }),
          ]),
          model: v.union([
            v.looseObject({
              mode: v.picklist(["auto"]),
            }),
            v.looseObject({
              mode: v.picklist(["pinned"]),
              id: v.nullable(v.union([v.string()])),
            }),
          ]),
          connections: v.pipe(
            v.array(
              v.union([
                v.looseObject({
                  type: v.picklist(["notion"]),
                  name: v.string(),
                  account: v.unknown(),
                  permissions: v.pipe(
                    v.array(
                      v.looseObject({
                        target: v.union([
                          v.looseObject({
                            type: v.picklist(["page"]),
                            id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["database_property"]),
                            data_source_id: v.string(),
                            property_id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["agent"]),
                            id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["workspace"]),
                          }),
                          v.looseObject({
                            type: v.picklist(["owner_private_pages"]),
                          }),
                          v.looseObject({
                            type: v.picklist(["web_search"]),
                            allowed_domains: v.nullable(v.union([v.pipe(v.array(v.string()), v.maxLength(100))])),
                          }),
                          v.looseObject({
                            type: v.picklist(["notion_help_docs_search"]),
                          }),
                        ]),
                        scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
                      }),
                    ),
                    v.maxLength(100),
                  ),
                }),
                v.looseObject({
                  type: v.picklist(["slack"]),
                  name: v.string(),
                  account: v.nullable(
                    v.union([
                      v.looseObject({
                        type: v.picklist(["slack_workspace"]),
                        team_id: v.string(),
                      }),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  permissions: v.pipe(
                    v.array(
                      v.looseObject({
                        target: v.union([
                          v.looseObject({
                            type: v.picklist(["slack_channel"]),
                            id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["slack_all_public_channels"]),
                          }),
                          v.looseObject({
                            type: v.picklist(["slack_all_channels"]),
                          }),
                        ]),
                        scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
                      }),
                    ),
                    v.maxLength(100),
                  ),
                }),
                v.looseObject({
                  type: v.picklist(["discord"]),
                  name: v.string(),
                  account: v.nullable(
                    v.union([
                      v.looseObject({
                        type: v.picklist(["discord_server"]),
                        id: v.string(),
                      }),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  permissions: v.pipe(
                    v.array(
                      v.looseObject({
                        target: v.union([
                          v.looseObject({
                            type: v.picklist(["discord_channel"]),
                            id: v.string(),
                          }),
                          v.looseObject({
                            type: v.picklist(["discord_all_channels"]),
                          }),
                        ]),
                        scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
                      }),
                    ),
                    v.maxLength(100),
                  ),
                }),
                v.looseObject({
                  type: v.picklist(["mcp_server"]),
                  name: v.string(),
                  account: v.nullable(
                    v.union([
                      v.looseObject({
                        type: v.picklist(["mcp_server"]),
                        server_host: v.string(),
                      }),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  enabled_tools: v.nullable(
                    v.union([
                      v.pipe(
                        v.array(
                          v.looseObject({
                            name: v.string(),
                            title: v.nullable(v.union([v.string()])),
                          }),
                        ),
                        v.maxLength(100),
                      ),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  run_tools_automatically: v.looseObject({
                    read: v.boolean(),
                    write: v.boolean(),
                  }),
                }),
                v.looseObject({
                  type: v.picklist(["custom_mcp_server"]),
                  name: v.string(),
                  account: v.nullable(
                    v.union([
                      v.looseObject({
                        type: v.picklist(["mcp_server"]),
                        server_host: v.string(),
                      }),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  enabled_tools: v.nullable(
                    v.union([
                      v.pipe(
                        v.array(
                          v.looseObject({
                            name: v.string(),
                            title: v.nullable(v.union([v.string()])),
                          }),
                        ),
                        v.maxLength(100),
                      ),
                      v.picklist(["hidden"]),
                    ]),
                  ),
                  run_tools_automatically: v.looseObject({
                    read: v.boolean(),
                    write: v.boolean(),
                  }),
                }),
                v.looseObject({
                  type: v.picklist([
                    "asana",
                    "box",
                    "calendar",
                    "computer",
                    "confluence",
                    "cursor",
                    "feedback",
                    "files",
                    "fs",
                    "github",
                    "gmail",
                    "google_calendar",
                    "google_drive",
                    "google_drive_oauth",
                    "gtm",
                    "helpdocs",
                    "images",
                    "jira",
                    "linear",
                    "mail",
                    "marketplace",
                    "memory",
                    "microsoft_teams",
                    "microsoft_teams_oauth",
                    "outlook",
                    "salesforce",
                    "search",
                    "security",
                    "sharepoint",
                    "sharepoint_oauth",
                    "shopify",
                    "skills",
                    "system",
                    "test",
                    "web",
                    "webhooks",
                    "worker",
                    "workers",
                  ]),
                  name: v.string(),
                  account: v.nullable(v.union([v.string()])),
                  permissions: v.pipe(
                    v.array(
                      v.looseObject({
                        target: v.looseObject({
                          type: v.string(),
                          id: v.string(),
                        }),
                        scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
                      }),
                    ),
                    v.maxLength(100),
                  ),
                }),
              ]),
            ),
            v.maxLength(100),
          ),
          status: v.picklist(["active"]),
          pause_reason: v.unknown(),
          created_by: v.unknown(),
          agent_version: v.unknown(),
          created_time: v.unknown(),
          last_edited_time: v.unknown(),
          last_run_at: v.unknown(),
          credit_limit: v.unknown(),
          triggers: v.pipe(
            v.array(
              v.looseObject({
                type: v.string(),
                enabled: v.boolean(),
                schedule: v.optional(
                  v.looseObject({
                    frequency: v.string(),
                    interval: integer({ minimum: 1 }),
                    weekdays: v.optional(v.pipe(v.array(v.string()), v.maxLength(100))),
                    monthdays: v.optional(v.pipe(v.array(integer({ minimum: 1 })), v.maxLength(100))),
                    week_numbers: v.optional(v.pipe(v.array(integer()), v.maxLength(100))),
                    hour: v.optional(integer({ minimum: 0 })),
                    minute: v.optional(integer({ minimum: 0 })),
                    timezone: v.optional(v.string()),
                    start_date: v.optional(v.string()),
                    end: v.optional(
                      v.union([
                        v.looseObject({
                          type: v.picklist(["date"]),
                          end_at: v.string(),
                        }),
                        v.looseObject({
                          type: v.picklist(["count"]),
                          occurrences: integer({ minimum: 0 }),
                        }),
                      ]),
                    ),
                  }),
                ),
                config: v.optional(v.record(v.string(), v.unknown())),
              }),
            ),
            v.maxLength(100),
          ),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  has_more: v.boolean(),
  next_cursor: v.nullable(v.union([v.string()])),
})

export const GetAgentResponse: v.GenericSchema<unknown, T.GetAgentResponse> = v.looseObject({
  object: v.picklist(["agent"]),
  id: v.union([v.lazy(() => IdResponse), v.picklist(["notion_ai"])]),
  agent_type: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent", "external"]),
  name: v.string(),
  description: v.nullable(v.union([v.string()])),
  instructions_page_id: v.nullable(v.union([v.lazy(() => IdResponse)])),
  icon: v.nullable(
    v.union([
      v.lazy(() => PageIconResponse),
      v.looseObject({
        type: v.picklist(["custom_agent_avatar"]),
        custom_agent_avatar: v.looseObject({
          static_url: v.string(),
          animated_url: v.string(),
        }),
      }),
    ]),
  ),
  model: v.union([
    v.looseObject({
      mode: v.picklist(["auto"]),
    }),
    v.looseObject({
      mode: v.picklist(["pinned"]),
      id: v.nullable(v.union([v.string()])),
    }),
  ]),
  connections: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          type: v.picklist(["notion"]),
          name: v.string(),
          account: v.unknown(),
          permissions: v.pipe(
            v.array(
              v.looseObject({
                target: v.union([
                  v.looseObject({
                    type: v.picklist(["page"]),
                    id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["database_property"]),
                    data_source_id: v.string(),
                    property_id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["agent"]),
                    id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["workspace"]),
                  }),
                  v.looseObject({
                    type: v.picklist(["owner_private_pages"]),
                  }),
                  v.looseObject({
                    type: v.picklist(["web_search"]),
                    allowed_domains: v.nullable(v.union([v.pipe(v.array(v.string()), v.maxLength(100))])),
                  }),
                  v.looseObject({
                    type: v.picklist(["notion_help_docs_search"]),
                  }),
                ]),
                scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
              }),
            ),
            v.maxLength(100),
          ),
        }),
        v.looseObject({
          type: v.picklist(["slack"]),
          name: v.string(),
          account: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["slack_workspace"]),
                team_id: v.string(),
              }),
              v.picklist(["hidden"]),
            ]),
          ),
          permissions: v.pipe(
            v.array(
              v.looseObject({
                target: v.union([
                  v.looseObject({
                    type: v.picklist(["slack_channel"]),
                    id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["slack_all_public_channels"]),
                  }),
                  v.looseObject({
                    type: v.picklist(["slack_all_channels"]),
                  }),
                ]),
                scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
              }),
            ),
            v.maxLength(100),
          ),
        }),
        v.looseObject({
          type: v.picklist(["discord"]),
          name: v.string(),
          account: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["discord_server"]),
                id: v.string(),
              }),
              v.picklist(["hidden"]),
            ]),
          ),
          permissions: v.pipe(
            v.array(
              v.looseObject({
                target: v.union([
                  v.looseObject({
                    type: v.picklist(["discord_channel"]),
                    id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["discord_all_channels"]),
                  }),
                ]),
                scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
              }),
            ),
            v.maxLength(100),
          ),
        }),
        v.looseObject({
          type: v.picklist(["mcp_server"]),
          name: v.string(),
          account: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["mcp_server"]),
                server_host: v.string(),
              }),
              v.picklist(["hidden"]),
            ]),
          ),
          enabled_tools: v.nullable(
            v.union([
              v.pipe(
                v.array(
                  v.looseObject({
                    name: v.string(),
                    title: v.nullable(v.union([v.string()])),
                  }),
                ),
                v.maxLength(100),
              ),
              v.picklist(["hidden"]),
            ]),
          ),
          run_tools_automatically: v.looseObject({
            read: v.boolean(),
            write: v.boolean(),
          }),
        }),
        v.looseObject({
          type: v.picklist(["custom_mcp_server"]),
          name: v.string(),
          account: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["mcp_server"]),
                server_host: v.string(),
              }),
              v.picklist(["hidden"]),
            ]),
          ),
          enabled_tools: v.nullable(
            v.union([
              v.pipe(
                v.array(
                  v.looseObject({
                    name: v.string(),
                    title: v.nullable(v.union([v.string()])),
                  }),
                ),
                v.maxLength(100),
              ),
              v.picklist(["hidden"]),
            ]),
          ),
          run_tools_automatically: v.looseObject({
            read: v.boolean(),
            write: v.boolean(),
          }),
        }),
        v.looseObject({
          type: v.picklist([
            "asana",
            "box",
            "calendar",
            "computer",
            "confluence",
            "cursor",
            "feedback",
            "files",
            "fs",
            "github",
            "gmail",
            "google_calendar",
            "google_drive",
            "google_drive_oauth",
            "gtm",
            "helpdocs",
            "images",
            "jira",
            "linear",
            "mail",
            "marketplace",
            "memory",
            "microsoft_teams",
            "microsoft_teams_oauth",
            "outlook",
            "salesforce",
            "search",
            "security",
            "sharepoint",
            "sharepoint_oauth",
            "shopify",
            "skills",
            "system",
            "test",
            "web",
            "webhooks",
            "worker",
            "workers",
          ]),
          name: v.string(),
          account: v.nullable(v.union([v.string()])),
          permissions: v.pipe(
            v.array(
              v.looseObject({
                target: v.looseObject({
                  type: v.string(),
                  id: v.string(),
                }),
                scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
              }),
            ),
            v.maxLength(100),
          ),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  status: v.picklist(["active", "disabled", "deleted"]),
  pause_reason: v.nullable(
    v.union([
      v.picklist([
        "run_limit",
        "credit_limit",
        "runaway_credit_usage",
        "workspace_credit_limit",
        "owner_allowance_limit",
        "failure_limit",
        "mark_session_failed_autopause",
        "disabled_from_workspace_settings",
        "disabled_from_workspace_settings_but_resumable",
        "disabled_from_api",
        "disabled_from_agent_settings",
        "disabled_due_to_no_members_with_access",
        "disabled_due_to_lack_of_editors",
        "disabled_by_notion",
        "internal_error",
        "needs_user_review",
        "tool_unavailable",
      ]),
    ]),
  ),
  created_by: v.nullable(
    v.union([
      v.looseObject({
        object: v.picklist(["user"]),
        type: v.picklist(["user"]),
        id: v.lazy(() => IdResponse),
      }),
    ]),
  ),
  version: v.nullable(
    v.union([
      v.looseObject({
        id: v.lazy(() => IdResponse),
        number: number(),
        published_at: v.string(),
      }),
    ]),
  ),
  agent_version: v.nullable(
    v.union([
      v.looseObject({
        id: v.lazy(() => IdResponse),
        number: number(),
        published_at: v.string(),
      }),
    ]),
  ),
  has_unpublished_changes: v.union([v.boolean(), v.picklist(["hidden"])]),
  last_run_time: v.nullable(v.union([v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}T/)), v.picklist(["hidden"])])),
  last_run_at: v.nullable(v.union([v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}T/)), v.picklist(["hidden"])])),
  credit_limit: v.nullable(v.union([integer({ minimum: 0 }), v.picklist(["hidden"])])),
  triggers: v.pipe(
    v.array(
      v.looseObject({
        type: v.string(),
        enabled: v.boolean(),
        schedule: v.optional(
          v.looseObject({
            frequency: v.string(),
            interval: integer({ minimum: 1 }),
            weekdays: v.optional(v.pipe(v.array(v.string()), v.maxLength(100))),
            monthdays: v.optional(v.pipe(v.array(integer({ minimum: 1 })), v.maxLength(100))),
            week_numbers: v.optional(v.pipe(v.array(integer()), v.maxLength(100))),
            hour: v.optional(integer({ minimum: 0 })),
            minute: v.optional(integer({ minimum: 0 })),
            timezone: v.optional(v.string()),
            start_date: v.optional(v.string()),
            end: v.optional(
              v.union([
                v.looseObject({
                  type: v.picklist(["date"]),
                  end_at: v.string(),
                }),
                v.looseObject({
                  type: v.picklist(["count"]),
                  occurrences: integer({ minimum: 0 }),
                }),
              ]),
            ),
          }),
        ),
        config: v.optional(v.record(v.string(), v.unknown())),
      }),
    ),
    v.maxLength(100),
  ),
  is_favorited: v.nullable(v.union([v.boolean()])),
  created_time: v.optional(v.string()),
  last_edited_time: v.optional(v.string()),
  instructions: v.optional(v.nullable(v.union([v.string()]))),
})

export const UpdateAgentRequest: v.GenericSchema<unknown, T.UpdateAgentRequest> = v.looseObject({
  status: v.optional(v.picklist(["active", "disabled"])),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  is_favorited: v.optional(v.boolean()),
  model: v.optional(
    v.union([
      v.looseObject({
        mode: v.picklist(["auto"]),
      }),
      v.looseObject({
        mode: v.picklist(["pinned"]),
        id: v.string(),
      }),
    ]),
  ),
})

export const UpdateAgentResponse: v.GenericSchema<unknown, T.UpdateAgentResponse> = v.looseObject({
  object: v.picklist(["agent"]),
  id: v.union([v.lazy(() => IdResponse), v.picklist(["notion_ai"])]),
  agent_type: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent", "external"]),
  name: v.string(),
  description: v.nullable(v.union([v.string()])),
  instructions_page_id: v.nullable(v.union([v.lazy(() => IdResponse)])),
  icon: v.nullable(
    v.union([
      v.lazy(() => PageIconResponse),
      v.looseObject({
        type: v.picklist(["custom_agent_avatar"]),
        custom_agent_avatar: v.looseObject({
          static_url: v.string(),
          animated_url: v.string(),
        }),
      }),
    ]),
  ),
  model: v.union([
    v.looseObject({
      mode: v.picklist(["auto"]),
    }),
    v.looseObject({
      mode: v.picklist(["pinned"]),
      id: v.nullable(v.union([v.string()])),
    }),
  ]),
  connections: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          type: v.picklist(["notion"]),
          name: v.string(),
          account: v.unknown(),
          permissions: v.pipe(
            v.array(
              v.looseObject({
                target: v.union([
                  v.looseObject({
                    type: v.picklist(["page"]),
                    id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["database_property"]),
                    data_source_id: v.string(),
                    property_id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["agent"]),
                    id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["workspace"]),
                  }),
                  v.looseObject({
                    type: v.picklist(["owner_private_pages"]),
                  }),
                  v.looseObject({
                    type: v.picklist(["web_search"]),
                    allowed_domains: v.nullable(v.union([v.pipe(v.array(v.string()), v.maxLength(100))])),
                  }),
                  v.looseObject({
                    type: v.picklist(["notion_help_docs_search"]),
                  }),
                ]),
                scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
              }),
            ),
            v.maxLength(100),
          ),
        }),
        v.looseObject({
          type: v.picklist(["slack"]),
          name: v.string(),
          account: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["slack_workspace"]),
                team_id: v.string(),
              }),
              v.picklist(["hidden"]),
            ]),
          ),
          permissions: v.pipe(
            v.array(
              v.looseObject({
                target: v.union([
                  v.looseObject({
                    type: v.picklist(["slack_channel"]),
                    id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["slack_all_public_channels"]),
                  }),
                  v.looseObject({
                    type: v.picklist(["slack_all_channels"]),
                  }),
                ]),
                scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
              }),
            ),
            v.maxLength(100),
          ),
        }),
        v.looseObject({
          type: v.picklist(["discord"]),
          name: v.string(),
          account: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["discord_server"]),
                id: v.string(),
              }),
              v.picklist(["hidden"]),
            ]),
          ),
          permissions: v.pipe(
            v.array(
              v.looseObject({
                target: v.union([
                  v.looseObject({
                    type: v.picklist(["discord_channel"]),
                    id: v.string(),
                  }),
                  v.looseObject({
                    type: v.picklist(["discord_all_channels"]),
                  }),
                ]),
                scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
              }),
            ),
            v.maxLength(100),
          ),
        }),
        v.looseObject({
          type: v.picklist(["mcp_server"]),
          name: v.string(),
          account: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["mcp_server"]),
                server_host: v.string(),
              }),
              v.picklist(["hidden"]),
            ]),
          ),
          enabled_tools: v.nullable(
            v.union([
              v.pipe(
                v.array(
                  v.looseObject({
                    name: v.string(),
                    title: v.nullable(v.union([v.string()])),
                  }),
                ),
                v.maxLength(100),
              ),
              v.picklist(["hidden"]),
            ]),
          ),
          run_tools_automatically: v.looseObject({
            read: v.boolean(),
            write: v.boolean(),
          }),
        }),
        v.looseObject({
          type: v.picklist(["custom_mcp_server"]),
          name: v.string(),
          account: v.nullable(
            v.union([
              v.looseObject({
                type: v.picklist(["mcp_server"]),
                server_host: v.string(),
              }),
              v.picklist(["hidden"]),
            ]),
          ),
          enabled_tools: v.nullable(
            v.union([
              v.pipe(
                v.array(
                  v.looseObject({
                    name: v.string(),
                    title: v.nullable(v.union([v.string()])),
                  }),
                ),
                v.maxLength(100),
              ),
              v.picklist(["hidden"]),
            ]),
          ),
          run_tools_automatically: v.looseObject({
            read: v.boolean(),
            write: v.boolean(),
          }),
        }),
        v.looseObject({
          type: v.picklist([
            "asana",
            "box",
            "calendar",
            "computer",
            "confluence",
            "cursor",
            "feedback",
            "files",
            "fs",
            "github",
            "gmail",
            "google_calendar",
            "google_drive",
            "google_drive_oauth",
            "gtm",
            "helpdocs",
            "images",
            "jira",
            "linear",
            "mail",
            "marketplace",
            "memory",
            "microsoft_teams",
            "microsoft_teams_oauth",
            "outlook",
            "salesforce",
            "search",
            "security",
            "sharepoint",
            "sharepoint_oauth",
            "shopify",
            "skills",
            "system",
            "test",
            "web",
            "webhooks",
            "worker",
            "workers",
          ]),
          name: v.string(),
          account: v.nullable(v.union([v.string()])),
          permissions: v.pipe(
            v.array(
              v.looseObject({
                target: v.looseObject({
                  type: v.string(),
                  id: v.string(),
                }),
                scopes: v.pipe(v.array(v.string()), v.maxLength(100)),
              }),
            ),
            v.maxLength(100),
          ),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  status: v.picklist(["active", "disabled", "deleted"]),
  pause_reason: v.nullable(
    v.union([
      v.picklist([
        "run_limit",
        "credit_limit",
        "runaway_credit_usage",
        "workspace_credit_limit",
        "owner_allowance_limit",
        "failure_limit",
        "mark_session_failed_autopause",
        "disabled_from_workspace_settings",
        "disabled_from_workspace_settings_but_resumable",
        "disabled_from_api",
        "disabled_from_agent_settings",
        "disabled_due_to_no_members_with_access",
        "disabled_due_to_lack_of_editors",
        "disabled_by_notion",
        "internal_error",
        "needs_user_review",
        "tool_unavailable",
      ]),
    ]),
  ),
  created_by: v.nullable(
    v.union([
      v.looseObject({
        object: v.picklist(["user"]),
        type: v.picklist(["user"]),
        id: v.lazy(() => IdResponse),
      }),
    ]),
  ),
  version: v.nullable(
    v.union([
      v.looseObject({
        id: v.lazy(() => IdResponse),
        number: number(),
        published_at: v.string(),
      }),
    ]),
  ),
  agent_version: v.nullable(
    v.union([
      v.looseObject({
        id: v.lazy(() => IdResponse),
        number: number(),
        published_at: v.string(),
      }),
    ]),
  ),
  has_unpublished_changes: v.union([v.boolean(), v.picklist(["hidden"])]),
  last_run_time: v.nullable(v.union([v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}T/)), v.picklist(["hidden"])])),
  last_run_at: v.nullable(v.union([v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}T/)), v.picklist(["hidden"])])),
  credit_limit: v.nullable(v.union([integer({ minimum: 0 }), v.picklist(["hidden"])])),
  triggers: v.pipe(
    v.array(
      v.looseObject({
        type: v.string(),
        enabled: v.boolean(),
        schedule: v.optional(
          v.looseObject({
            frequency: v.string(),
            interval: integer({ minimum: 1 }),
            weekdays: v.optional(v.pipe(v.array(v.string()), v.maxLength(100))),
            monthdays: v.optional(v.pipe(v.array(integer({ minimum: 1 })), v.maxLength(100))),
            week_numbers: v.optional(v.pipe(v.array(integer()), v.maxLength(100))),
            hour: v.optional(integer({ minimum: 0 })),
            minute: v.optional(integer({ minimum: 0 })),
            timezone: v.optional(v.string()),
            start_date: v.optional(v.string()),
            end: v.optional(
              v.union([
                v.looseObject({
                  type: v.picklist(["date"]),
                  end_at: v.string(),
                }),
                v.looseObject({
                  type: v.picklist(["count"]),
                  occurrences: integer({ minimum: 0 }),
                }),
              ]),
            ),
          }),
        ),
        config: v.optional(v.record(v.string(), v.unknown())),
      }),
    ),
    v.maxLength(100),
  ),
  is_favorited: v.nullable(v.union([v.boolean()])),
  created_time: v.optional(v.string()),
  last_edited_time: v.optional(v.string()),
  instructions: v.optional(v.nullable(v.union([v.string()]))),
})

export const DeleteAgentResponse: v.GenericSchema<unknown, T.DeleteAgentResponse> = v.looseObject({
  agent_id: v.lazy(() => IdResponse),
  status: v.picklist(["deleted"]),
  deleted_at: v.string(),
})

export const GetAgentInsightsResponse: v.GenericSchema<unknown, T.GetAgentInsightsResponse> = v.looseObject({
  object: v.picklist(["agent_insights"]),
  id: v.union([v.lazy(() => IdResponse), v.picklist(["notion_ai"])]),
  name: v.string(),
  agent_type: v.picklist(["notion_ai", "custom_agent", "autofill_custom_agent"]),
  status: v.picklist(["active", "disabled", "deleted"]),
  pause_reason: v.nullable(
    v.union([
      v.picklist([
        "run_limit",
        "credit_limit",
        "runaway_credit_usage",
        "workspace_credit_limit",
        "owner_allowance_limit",
        "failure_limit",
        "mark_session_failed_autopause",
        "disabled_from_workspace_settings",
        "disabled_from_workspace_settings_but_resumable",
        "disabled_from_api",
        "disabled_from_agent_settings",
        "disabled_due_to_no_members_with_access",
        "disabled_due_to_lack_of_editors",
        "disabled_by_notion",
        "internal_error",
        "needs_user_review",
        "tool_unavailable",
      ]),
    ]),
  ),
  created_by: v.nullable(
    v.union([
      v.looseObject({
        id: v.string(),
        type: v.picklist(["user", "bot"]),
      }),
    ]),
  ),
  total_credits_used: number(),
  credit_limit: v.nullable(v.union([integer(), v.picklist(["hidden"])])),
  runs_completed: number(),
})

export const UpdateAgentStatusRequest: v.GenericSchema<unknown, T.UpdateAgentStatusRequest> = v.looseObject({
  status: v.picklist(["active", "disabled"]),
})

export const UpdateAgentStatusResponse: v.GenericSchema<unknown, T.UpdateAgentStatusResponse> = v.looseObject({
  agent_id: v.lazy(() => IdResponse),
  status: v.picklist(["active", "disabled", "deleted"]),
  pause_reason: v.nullable(
    v.union([
      v.picklist([
        "run_limit",
        "credit_limit",
        "runaway_credit_usage",
        "workspace_credit_limit",
        "owner_allowance_limit",
        "failure_limit",
        "mark_session_failed_autopause",
        "disabled_from_workspace_settings",
        "disabled_from_workspace_settings_but_resumable",
        "disabled_from_api",
        "disabled_from_agent_settings",
        "disabled_due_to_no_members_with_access",
        "disabled_due_to_lack_of_editors",
        "disabled_by_notion",
        "internal_error",
        "needs_user_review",
        "tool_unavailable",
      ]),
    ]),
  ),
  last_edited_time: v.string(),
})

export const UpdateAgentCreditLimitRequest: v.GenericSchema<unknown, T.UpdateAgentCreditLimitRequest> = v.looseObject({
  credit_limit: v.nullable(v.union([integer()])),
})

export const UpdateAgentCreditLimitResponse: v.GenericSchema<unknown, T.UpdateAgentCreditLimitResponse> = v.looseObject(
  {
    agent_id: v.lazy(() => IdResponse),
    credit_limit: v.nullable(v.union([integer()])),
    last_edited_time: v.string(),
  },
)

export const AgentBatchRequest: v.GenericSchema<unknown, T.AgentBatchRequest> = v.looseObject({
  operations: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          action: v.picklist(["update_status"]),
          agent_id: v.union([v.lazy(() => IdRequest), v.picklist(["notion_ai"])]),
          fields: v.looseObject({
            status: v.picklist(["active", "disabled"]),
          }),
        }),
        v.looseObject({
          action: v.picklist(["update_credit_limit"]),
          agent_id: v.union([v.lazy(() => IdRequest), v.picklist(["notion_ai"])]),
          fields: v.looseObject({
            credit_limit: v.nullable(v.union([integer()])),
          }),
        }),
        v.looseObject({
          action: v.picklist(["delete"]),
          agent_id: v.union([v.lazy(() => IdRequest), v.picklist(["notion_ai"])]),
        }),
      ]),
    ),
    v.minLength(1),
    v.maxLength(100),
  ),
})

export const AgentBatchResponse: v.GenericSchema<unknown, T.AgentBatchResponse> = v.looseObject({
  object: v.picklist(["async_task"]),
  id: v.pipe(v.string(), v.minLength(1)),
  status_url: v.pipe(v.string(), v.minLength(1)),
  created_time: v.string(),
  operation: v.looseObject({
    surface: v.picklist(["rest", "mcp"]),
    name: v.pipe(v.string(), v.minLength(1)),
  }),
  status: v.picklist(["queued", "running", "retrying"]),
  poll_after_seconds: integer({ minimum: 0 }),
})

export const ListSkillsPluginsResponse: v.GenericSchema<unknown, T.ListSkillsPluginsResponse> = v.looseObject({
  object: v.picklist(["list"]),
  results: v.pipe(
    v.array(
      v.looseObject({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        version_id: v.pipe(v.string(), v.minLength(64), v.maxLength(64)),
      }),
    ),
    v.maxLength(100),
  ),
  next_cursor: v.nullable(v.union([v.string()])),
  has_more: v.boolean(),
  type: v.picklist(["plugin"]),
})

export const GetPluginDirectoryResponse: v.GenericSchema<unknown, T.GetPluginDirectoryResponse> = v.looseObject({
  id: v.string(),
  version_id: v.pipe(v.string(), v.minLength(64), v.maxLength(64)),
  url: v.string(),
})

export const GetSkillDirectoryResponse: v.GenericSchema<unknown, T.GetSkillDirectoryResponse> = v.looseObject({
  id: v.string(),
  version_id: v.pipe(v.string(), v.minLength(64), v.maxLength(64)),
  url: v.pipe(v.string(), v.minLength(1)),
})

export const UpdateSessionRequest: v.GenericSchema<unknown, T.UpdateSessionRequest> = v.union([
  v.looseObject({
    message: v.pipe(v.string(), v.maxLength(10000)),
    agent_id: v.optional(v.union([v.lazy(() => IdRequest), v.picklist(["notion_ai"])])),
    session_id: v.optional(v.lazy(() => IdRequest)),
    attachments: v.optional(
      v.pipe(
        v.array(
          v.looseObject({
            file_upload: v.looseObject({
              id: v.pipe(v.string(), v.maxLength(200)),
            }),
            type: v.optional(v.picklist(["file_upload"])),
            name: v.optional(v.pipe(v.string(), v.maxLength(1000))),
          }),
        ),
        v.maxLength(100),
      ),
    ),
    metadata: v.optional(v.record(v.string(), v.pipe(v.string(), v.maxLength(2000)))),
    prompt_context: v.optional(v.pipe(v.string(), v.maxLength(10000))),
  }),
  v.looseObject({
    session_id: v.lazy(() => IdRequest),
    actions: v.pipe(
      v.array(
        v.looseObject({
          action_id: v.lazy(() => IdRequest),
          option_id: v.picklist(["approve", "reject"]),
        }),
      ),
      v.minLength(1),
      v.maxLength(100),
      v.check((items) => unique(items), "items must be unique"),
    ),
    metadata: v.optional(v.record(v.string(), v.pipe(v.string(), v.maxLength(2000)))),
  }),
  v.looseObject({
    session_id: v.lazy(() => IdRequest),
    continue_from: v.pipe(v.string(), v.maxLength(200)),
  }),
])

export const UpdateSessionResponse: v.GenericSchema<unknown, T.UpdateSessionResponse> = v.looseObject({
  object: v.picklist(["session"]),
  id: v.string(),
  agent_id: v.string(),
  title: v.string(),
  status: v.picklist(["queued", "in_progress", "requires_action", "completed", "failed", "canceled", "terminated"]),
  created_at: v.string(),
  updated_at: v.string(),
  required_actions: v.optional(
    v.pipe(
      v.array(
        v.looseObject({
          action_id: v.string(),
          title: v.string(),
          options: v.pipe(
            v.array(
              v.looseObject({
                id: v.picklist(["approve", "reject"]),
                label: v.string(),
              }),
            ),
            v.maxLength(100),
          ),
        }),
      ),
      v.maxLength(100),
    ),
  ),
  error: v.optional(
    v.looseObject({
      code: v.string(),
      message: v.string(),
      retryable: v.boolean(),
    }),
  ),
})

export const RetrieveSessionResponse: v.GenericSchema<unknown, T.RetrieveSessionResponse> = v.looseObject({
  object: v.picklist(["session"]),
  id: v.string(),
  agent_id: v.string(),
  title: v.string(),
  status: v.picklist(["queued", "in_progress", "requires_action", "completed", "failed", "canceled", "terminated"]),
  created_at: v.string(),
  updated_at: v.string(),
  created_by: v.looseObject({
    id: v.string(),
    type: v.picklist(["user", "bot"]),
  }),
  agent_version: v.nullable(
    v.union([
      v.looseObject({
        id: v.string(),
        number: integer({ minimum: 1 }),
        published_at: v.string(),
      }),
    ]),
  ),
  models: v.union([
    v.looseObject({
      type: v.picklist(["auto"]),
    }),
    v.looseObject({
      type: v.picklist(["pinned"]),
      ids: v.array(v.nullable(v.union([v.string()]))),
    }),
  ]),
  required_actions: v.optional(
    v.array(
      v.looseObject({
        action_id: v.string(),
        title: v.string(),
        options: v.pipe(
          v.array(
            v.looseObject({
              id: v.picklist(["approve", "reject"]),
              label: v.string(),
            }),
          ),
          v.maxLength(100),
        ),
      }),
    ),
  ),
  error: v.optional(
    v.looseObject({
      code: v.string(),
      message: v.string(),
      retryable: v.boolean(),
    }),
  ),
  trigger_type: v.optional(v.string()),
  type_labels: v.optional(v.nullable(v.union([v.array(v.string())]))),
  chat_user_emails: v.optional(v.nullable(v.union([v.array(v.string())]))),
  tool_types: v.optional(v.nullable(v.union([v.array(v.string())]))),
  tool_call_count: v.optional(v.nullable(v.union([integer({ minimum: 0 })]))),
  credits_used: v.optional(v.nullable(v.union([number()]))),
  runs_completed: v.optional(v.nullable(v.union([integer({ minimum: 0 })]))),
  message_count: v.optional(v.nullable(v.union([integer({ minimum: 0 })]))),
})

export const QuerySessionsRequest: v.GenericSchema<unknown, T.QuerySessionsRequest> = v.looseObject({
  query: v.optional(v.pipe(v.string(), v.maxLength(2000))),
  filter: v.optional(
    v.union([
      v.lazy(() => SessionIdFilter),
      v.lazy(() => SessionAgentIdFilter),
      v.lazy(() => SessionStatusFilter),
      v.lazy(() => SessionTimestampFilter),
      v.looseObject({
        and: v.pipe(v.array(v.lazy(() => SessionNestedFilter)), v.maxLength(100)),
      }),
      v.looseObject({
        or: v.pipe(v.array(v.lazy(() => SessionNestedFilter)), v.maxLength(100)),
      }),
    ]),
  ),
  sorts: v.optional(
    v.pipe(
      v.array(
        v.looseObject({
          property: v.picklist(["created_at", "updated_at"]),
          direction: v.picklist(["ascending", "descending"]),
        }),
      ),
      v.minLength(1),
      v.maxLength(2),
    ),
  ),
  start_cursor: v.optional(v.string()),
  page_size: v.optional(integer({ minimum: 1, maximum: 100 })),
})

export const QuerySessionsResponse: v.GenericSchema<unknown, T.QuerySessionsResponse> = v.looseObject({
  object: v.picklist(["list"]),
  type: v.picklist(["session"]),
  session: v.looseObject({}),
  results: v.pipe(
    v.array(
      v.looseObject({
        object: v.picklist(["session"]),
        id: v.string(),
        agent_id: v.string(),
        title: v.string(),
        status: v.picklist([
          "queued",
          "in_progress",
          "requires_action",
          "completed",
          "failed",
          "canceled",
          "terminated",
        ]),
        created_by: v.looseObject({
          id: v.string(),
          type: v.picklist(["user", "bot"]),
        }),
        agent_version: v.nullable(
          v.union([
            v.looseObject({
              id: v.string(),
              number: integer({ minimum: 1 }),
              published_at: v.string(),
            }),
          ]),
        ),
        models: v.union([
          v.looseObject({
            type: v.picklist(["auto"]),
          }),
          v.looseObject({
            type: v.picklist(["pinned"]),
            ids: v.array(v.nullable(v.union([v.string()]))),
          }),
        ]),
        created_at: v.string(),
        updated_at: v.string(),
        required_actions: v.optional(
          v.array(
            v.looseObject({
              action_id: v.string(),
              title: v.string(),
              options: v.pipe(
                v.array(
                  v.looseObject({
                    id: v.picklist(["approve", "reject"]),
                    label: v.string(),
                  }),
                ),
                v.maxLength(100),
              ),
            }),
          ),
        ),
        error: v.optional(
          v.looseObject({
            code: v.string(),
            message: v.string(),
            retryable: v.boolean(),
          }),
        ),
        trigger_type: v.optional(v.string()),
        type_labels: v.optional(v.nullable(v.union([v.array(v.string())]))),
        chat_user_emails: v.optional(v.nullable(v.union([v.array(v.string())]))),
        tool_types: v.optional(v.nullable(v.union([v.array(v.string())]))),
        tool_call_count: v.optional(v.nullable(v.union([integer({ minimum: 0 })]))),
        credits_used: v.optional(v.nullable(v.union([number({ minimum: 0 })]))),
        runs_completed: v.optional(v.nullable(v.union([integer({ minimum: 0 })]))),
        message_count: v.optional(v.nullable(v.union([integer({ minimum: 0 })]))),
      }),
    ),
    v.maxLength(100),
  ),
  has_more: v.boolean(),
  next_cursor: v.nullable(v.union([v.string()])),
})

export const QuerySessionEventsRequest: v.GenericSchema<unknown, T.QuerySessionEventsRequest> = v.looseObject({
  filter: v.optional(
    v.union([
      v.looseObject({
        property: v.picklist(["id"]),
        string: v.looseObject({
          equals: v.string(),
        }),
      }),
      v.looseObject({
        property: v.picklist(["type"]),
        event_type: v.looseObject({
          equals: v.optional(
            v.picklist([
              "user.message",
              "agent.message",
              "agent.thinking",
              "agent.tool_use",
              "agent.tool_result",
              "session.status",
            ]),
          ),
          in: v.optional(
            v.array(
              v.picklist([
                "user.message",
                "agent.message",
                "agent.thinking",
                "agent.tool_use",
                "agent.tool_result",
                "session.status",
              ]),
            ),
          ),
        }),
      }),
      v.looseObject({
        property: v.picklist(["sequence"]),
        number: v.looseObject({
          greater_than: v.optional(number()),
          greater_than_or_equal_to: v.optional(number()),
          less_than: v.optional(number()),
          less_than_or_equal_to: v.optional(number()),
        }),
      }),
      v.looseObject({
        property: v.picklist(["created_at"]),
        timestamp: v.looseObject({
          equals: v.optional(v.string()),
          before: v.optional(v.string()),
          after: v.optional(v.string()),
          on_or_before: v.optional(v.string()),
          on_or_after: v.optional(v.string()),
        }),
      }),
      v.looseObject({
        and: v.array(
          v.union([
            v.looseObject({
              property: v.picklist(["id"]),
              string: v.looseObject({
                equals: v.string(),
              }),
            }),
            v.looseObject({
              property: v.picklist(["type"]),
              event_type: v.looseObject({
                equals: v.optional(
                  v.picklist([
                    "user.message",
                    "agent.message",
                    "agent.thinking",
                    "agent.tool_use",
                    "agent.tool_result",
                    "session.status",
                  ]),
                ),
                in: v.optional(
                  v.array(
                    v.picklist([
                      "user.message",
                      "agent.message",
                      "agent.thinking",
                      "agent.tool_use",
                      "agent.tool_result",
                      "session.status",
                    ]),
                  ),
                ),
              }),
            }),
            v.looseObject({
              property: v.picklist(["sequence"]),
              number: v.looseObject({
                greater_than: v.optional(number()),
                greater_than_or_equal_to: v.optional(number()),
                less_than: v.optional(number()),
                less_than_or_equal_to: v.optional(number()),
              }),
            }),
            v.looseObject({
              property: v.picklist(["created_at"]),
              timestamp: v.looseObject({
                equals: v.optional(v.string()),
                before: v.optional(v.string()),
                after: v.optional(v.string()),
                on_or_before: v.optional(v.string()),
                on_or_after: v.optional(v.string()),
              }),
            }),
            v.looseObject({
              and: v.array(
                v.union([
                  v.looseObject({
                    property: v.picklist(["id"]),
                    string: v.looseObject({
                      equals: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["type"]),
                    event_type: v.looseObject({
                      equals: v.optional(
                        v.picklist([
                          "user.message",
                          "agent.message",
                          "agent.thinking",
                          "agent.tool_use",
                          "agent.tool_result",
                          "session.status",
                        ]),
                      ),
                      in: v.optional(
                        v.array(
                          v.picklist([
                            "user.message",
                            "agent.message",
                            "agent.thinking",
                            "agent.tool_use",
                            "agent.tool_result",
                            "session.status",
                          ]),
                        ),
                      ),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["sequence"]),
                    number: v.looseObject({
                      greater_than: v.optional(number()),
                      greater_than_or_equal_to: v.optional(number()),
                      less_than: v.optional(number()),
                      less_than_or_equal_to: v.optional(number()),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["created_at"]),
                    timestamp: v.looseObject({
                      equals: v.optional(v.string()),
                      before: v.optional(v.string()),
                      after: v.optional(v.string()),
                      on_or_before: v.optional(v.string()),
                      on_or_after: v.optional(v.string()),
                    }),
                  }),
                  v.looseObject({
                    and: v.array(
                      v.union([
                        v.looseObject({
                          property: v.picklist(["id"]),
                          string: v.looseObject({
                            equals: v.string(),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["type"]),
                          event_type: v.looseObject({
                            equals: v.optional(
                              v.picklist([
                                "user.message",
                                "agent.message",
                                "agent.thinking",
                                "agent.tool_use",
                                "agent.tool_result",
                                "session.status",
                              ]),
                            ),
                            in: v.optional(
                              v.array(
                                v.picklist([
                                  "user.message",
                                  "agent.message",
                                  "agent.thinking",
                                  "agent.tool_use",
                                  "agent.tool_result",
                                  "session.status",
                                ]),
                              ),
                            ),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["sequence"]),
                          number: v.looseObject({
                            greater_than: v.optional(number()),
                            greater_than_or_equal_to: v.optional(number()),
                            less_than: v.optional(number()),
                            less_than_or_equal_to: v.optional(number()),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["created_at"]),
                          timestamp: v.looseObject({
                            equals: v.optional(v.string()),
                            before: v.optional(v.string()),
                            after: v.optional(v.string()),
                            on_or_before: v.optional(v.string()),
                            on_or_after: v.optional(v.string()),
                          }),
                        }),
                      ]),
                    ),
                  }),
                  v.looseObject({
                    or: v.array(
                      v.union([
                        v.looseObject({
                          property: v.picklist(["id"]),
                          string: v.looseObject({
                            equals: v.string(),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["type"]),
                          event_type: v.looseObject({
                            equals: v.optional(
                              v.picklist([
                                "user.message",
                                "agent.message",
                                "agent.thinking",
                                "agent.tool_use",
                                "agent.tool_result",
                                "session.status",
                              ]),
                            ),
                            in: v.optional(
                              v.array(
                                v.picklist([
                                  "user.message",
                                  "agent.message",
                                  "agent.thinking",
                                  "agent.tool_use",
                                  "agent.tool_result",
                                  "session.status",
                                ]),
                              ),
                            ),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["sequence"]),
                          number: v.looseObject({
                            greater_than: v.optional(number()),
                            greater_than_or_equal_to: v.optional(number()),
                            less_than: v.optional(number()),
                            less_than_or_equal_to: v.optional(number()),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["created_at"]),
                          timestamp: v.looseObject({
                            equals: v.optional(v.string()),
                            before: v.optional(v.string()),
                            after: v.optional(v.string()),
                            on_or_before: v.optional(v.string()),
                            on_or_after: v.optional(v.string()),
                          }),
                        }),
                      ]),
                    ),
                  }),
                ]),
              ),
            }),
            v.looseObject({
              or: v.array(
                v.union([
                  v.looseObject({
                    property: v.picklist(["id"]),
                    string: v.looseObject({
                      equals: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["type"]),
                    event_type: v.looseObject({
                      equals: v.optional(
                        v.picklist([
                          "user.message",
                          "agent.message",
                          "agent.thinking",
                          "agent.tool_use",
                          "agent.tool_result",
                          "session.status",
                        ]),
                      ),
                      in: v.optional(
                        v.array(
                          v.picklist([
                            "user.message",
                            "agent.message",
                            "agent.thinking",
                            "agent.tool_use",
                            "agent.tool_result",
                            "session.status",
                          ]),
                        ),
                      ),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["sequence"]),
                    number: v.looseObject({
                      greater_than: v.optional(number()),
                      greater_than_or_equal_to: v.optional(number()),
                      less_than: v.optional(number()),
                      less_than_or_equal_to: v.optional(number()),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["created_at"]),
                    timestamp: v.looseObject({
                      equals: v.optional(v.string()),
                      before: v.optional(v.string()),
                      after: v.optional(v.string()),
                      on_or_before: v.optional(v.string()),
                      on_or_after: v.optional(v.string()),
                    }),
                  }),
                  v.looseObject({
                    and: v.array(
                      v.union([
                        v.looseObject({
                          property: v.picklist(["id"]),
                          string: v.looseObject({
                            equals: v.string(),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["type"]),
                          event_type: v.looseObject({
                            equals: v.optional(
                              v.picklist([
                                "user.message",
                                "agent.message",
                                "agent.thinking",
                                "agent.tool_use",
                                "agent.tool_result",
                                "session.status",
                              ]),
                            ),
                            in: v.optional(
                              v.array(
                                v.picklist([
                                  "user.message",
                                  "agent.message",
                                  "agent.thinking",
                                  "agent.tool_use",
                                  "agent.tool_result",
                                  "session.status",
                                ]),
                              ),
                            ),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["sequence"]),
                          number: v.looseObject({
                            greater_than: v.optional(number()),
                            greater_than_or_equal_to: v.optional(number()),
                            less_than: v.optional(number()),
                            less_than_or_equal_to: v.optional(number()),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["created_at"]),
                          timestamp: v.looseObject({
                            equals: v.optional(v.string()),
                            before: v.optional(v.string()),
                            after: v.optional(v.string()),
                            on_or_before: v.optional(v.string()),
                            on_or_after: v.optional(v.string()),
                          }),
                        }),
                      ]),
                    ),
                  }),
                  v.looseObject({
                    or: v.array(
                      v.union([
                        v.looseObject({
                          property: v.picklist(["id"]),
                          string: v.looseObject({
                            equals: v.string(),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["type"]),
                          event_type: v.looseObject({
                            equals: v.optional(
                              v.picklist([
                                "user.message",
                                "agent.message",
                                "agent.thinking",
                                "agent.tool_use",
                                "agent.tool_result",
                                "session.status",
                              ]),
                            ),
                            in: v.optional(
                              v.array(
                                v.picklist([
                                  "user.message",
                                  "agent.message",
                                  "agent.thinking",
                                  "agent.tool_use",
                                  "agent.tool_result",
                                  "session.status",
                                ]),
                              ),
                            ),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["sequence"]),
                          number: v.looseObject({
                            greater_than: v.optional(number()),
                            greater_than_or_equal_to: v.optional(number()),
                            less_than: v.optional(number()),
                            less_than_or_equal_to: v.optional(number()),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["created_at"]),
                          timestamp: v.looseObject({
                            equals: v.optional(v.string()),
                            before: v.optional(v.string()),
                            after: v.optional(v.string()),
                            on_or_before: v.optional(v.string()),
                            on_or_after: v.optional(v.string()),
                          }),
                        }),
                      ]),
                    ),
                  }),
                ]),
              ),
            }),
          ]),
        ),
      }),
      v.looseObject({
        or: v.array(
          v.union([
            v.looseObject({
              property: v.picklist(["id"]),
              string: v.looseObject({
                equals: v.string(),
              }),
            }),
            v.looseObject({
              property: v.picklist(["type"]),
              event_type: v.looseObject({
                equals: v.optional(
                  v.picklist([
                    "user.message",
                    "agent.message",
                    "agent.thinking",
                    "agent.tool_use",
                    "agent.tool_result",
                    "session.status",
                  ]),
                ),
                in: v.optional(
                  v.array(
                    v.picklist([
                      "user.message",
                      "agent.message",
                      "agent.thinking",
                      "agent.tool_use",
                      "agent.tool_result",
                      "session.status",
                    ]),
                  ),
                ),
              }),
            }),
            v.looseObject({
              property: v.picklist(["sequence"]),
              number: v.looseObject({
                greater_than: v.optional(number()),
                greater_than_or_equal_to: v.optional(number()),
                less_than: v.optional(number()),
                less_than_or_equal_to: v.optional(number()),
              }),
            }),
            v.looseObject({
              property: v.picklist(["created_at"]),
              timestamp: v.looseObject({
                equals: v.optional(v.string()),
                before: v.optional(v.string()),
                after: v.optional(v.string()),
                on_or_before: v.optional(v.string()),
                on_or_after: v.optional(v.string()),
              }),
            }),
            v.looseObject({
              and: v.array(
                v.union([
                  v.looseObject({
                    property: v.picklist(["id"]),
                    string: v.looseObject({
                      equals: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["type"]),
                    event_type: v.looseObject({
                      equals: v.optional(
                        v.picklist([
                          "user.message",
                          "agent.message",
                          "agent.thinking",
                          "agent.tool_use",
                          "agent.tool_result",
                          "session.status",
                        ]),
                      ),
                      in: v.optional(
                        v.array(
                          v.picklist([
                            "user.message",
                            "agent.message",
                            "agent.thinking",
                            "agent.tool_use",
                            "agent.tool_result",
                            "session.status",
                          ]),
                        ),
                      ),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["sequence"]),
                    number: v.looseObject({
                      greater_than: v.optional(number()),
                      greater_than_or_equal_to: v.optional(number()),
                      less_than: v.optional(number()),
                      less_than_or_equal_to: v.optional(number()),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["created_at"]),
                    timestamp: v.looseObject({
                      equals: v.optional(v.string()),
                      before: v.optional(v.string()),
                      after: v.optional(v.string()),
                      on_or_before: v.optional(v.string()),
                      on_or_after: v.optional(v.string()),
                    }),
                  }),
                  v.looseObject({
                    and: v.array(
                      v.union([
                        v.looseObject({
                          property: v.picklist(["id"]),
                          string: v.looseObject({
                            equals: v.string(),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["type"]),
                          event_type: v.looseObject({
                            equals: v.optional(
                              v.picklist([
                                "user.message",
                                "agent.message",
                                "agent.thinking",
                                "agent.tool_use",
                                "agent.tool_result",
                                "session.status",
                              ]),
                            ),
                            in: v.optional(
                              v.array(
                                v.picklist([
                                  "user.message",
                                  "agent.message",
                                  "agent.thinking",
                                  "agent.tool_use",
                                  "agent.tool_result",
                                  "session.status",
                                ]),
                              ),
                            ),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["sequence"]),
                          number: v.looseObject({
                            greater_than: v.optional(number()),
                            greater_than_or_equal_to: v.optional(number()),
                            less_than: v.optional(number()),
                            less_than_or_equal_to: v.optional(number()),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["created_at"]),
                          timestamp: v.looseObject({
                            equals: v.optional(v.string()),
                            before: v.optional(v.string()),
                            after: v.optional(v.string()),
                            on_or_before: v.optional(v.string()),
                            on_or_after: v.optional(v.string()),
                          }),
                        }),
                      ]),
                    ),
                  }),
                  v.looseObject({
                    or: v.array(
                      v.union([
                        v.looseObject({
                          property: v.picklist(["id"]),
                          string: v.looseObject({
                            equals: v.string(),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["type"]),
                          event_type: v.looseObject({
                            equals: v.optional(
                              v.picklist([
                                "user.message",
                                "agent.message",
                                "agent.thinking",
                                "agent.tool_use",
                                "agent.tool_result",
                                "session.status",
                              ]),
                            ),
                            in: v.optional(
                              v.array(
                                v.picklist([
                                  "user.message",
                                  "agent.message",
                                  "agent.thinking",
                                  "agent.tool_use",
                                  "agent.tool_result",
                                  "session.status",
                                ]),
                              ),
                            ),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["sequence"]),
                          number: v.looseObject({
                            greater_than: v.optional(number()),
                            greater_than_or_equal_to: v.optional(number()),
                            less_than: v.optional(number()),
                            less_than_or_equal_to: v.optional(number()),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["created_at"]),
                          timestamp: v.looseObject({
                            equals: v.optional(v.string()),
                            before: v.optional(v.string()),
                            after: v.optional(v.string()),
                            on_or_before: v.optional(v.string()),
                            on_or_after: v.optional(v.string()),
                          }),
                        }),
                      ]),
                    ),
                  }),
                ]),
              ),
            }),
            v.looseObject({
              or: v.array(
                v.union([
                  v.looseObject({
                    property: v.picklist(["id"]),
                    string: v.looseObject({
                      equals: v.string(),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["type"]),
                    event_type: v.looseObject({
                      equals: v.optional(
                        v.picklist([
                          "user.message",
                          "agent.message",
                          "agent.thinking",
                          "agent.tool_use",
                          "agent.tool_result",
                          "session.status",
                        ]),
                      ),
                      in: v.optional(
                        v.array(
                          v.picklist([
                            "user.message",
                            "agent.message",
                            "agent.thinking",
                            "agent.tool_use",
                            "agent.tool_result",
                            "session.status",
                          ]),
                        ),
                      ),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["sequence"]),
                    number: v.looseObject({
                      greater_than: v.optional(number()),
                      greater_than_or_equal_to: v.optional(number()),
                      less_than: v.optional(number()),
                      less_than_or_equal_to: v.optional(number()),
                    }),
                  }),
                  v.looseObject({
                    property: v.picklist(["created_at"]),
                    timestamp: v.looseObject({
                      equals: v.optional(v.string()),
                      before: v.optional(v.string()),
                      after: v.optional(v.string()),
                      on_or_before: v.optional(v.string()),
                      on_or_after: v.optional(v.string()),
                    }),
                  }),
                  v.looseObject({
                    and: v.array(
                      v.union([
                        v.looseObject({
                          property: v.picklist(["id"]),
                          string: v.looseObject({
                            equals: v.string(),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["type"]),
                          event_type: v.looseObject({
                            equals: v.optional(
                              v.picklist([
                                "user.message",
                                "agent.message",
                                "agent.thinking",
                                "agent.tool_use",
                                "agent.tool_result",
                                "session.status",
                              ]),
                            ),
                            in: v.optional(
                              v.array(
                                v.picklist([
                                  "user.message",
                                  "agent.message",
                                  "agent.thinking",
                                  "agent.tool_use",
                                  "agent.tool_result",
                                  "session.status",
                                ]),
                              ),
                            ),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["sequence"]),
                          number: v.looseObject({
                            greater_than: v.optional(number()),
                            greater_than_or_equal_to: v.optional(number()),
                            less_than: v.optional(number()),
                            less_than_or_equal_to: v.optional(number()),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["created_at"]),
                          timestamp: v.looseObject({
                            equals: v.optional(v.string()),
                            before: v.optional(v.string()),
                            after: v.optional(v.string()),
                            on_or_before: v.optional(v.string()),
                            on_or_after: v.optional(v.string()),
                          }),
                        }),
                      ]),
                    ),
                  }),
                  v.looseObject({
                    or: v.array(
                      v.union([
                        v.looseObject({
                          property: v.picklist(["id"]),
                          string: v.looseObject({
                            equals: v.string(),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["type"]),
                          event_type: v.looseObject({
                            equals: v.optional(
                              v.picklist([
                                "user.message",
                                "agent.message",
                                "agent.thinking",
                                "agent.tool_use",
                                "agent.tool_result",
                                "session.status",
                              ]),
                            ),
                            in: v.optional(
                              v.array(
                                v.picklist([
                                  "user.message",
                                  "agent.message",
                                  "agent.thinking",
                                  "agent.tool_use",
                                  "agent.tool_result",
                                  "session.status",
                                ]),
                              ),
                            ),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["sequence"]),
                          number: v.looseObject({
                            greater_than: v.optional(number()),
                            greater_than_or_equal_to: v.optional(number()),
                            less_than: v.optional(number()),
                            less_than_or_equal_to: v.optional(number()),
                          }),
                        }),
                        v.looseObject({
                          property: v.picklist(["created_at"]),
                          timestamp: v.looseObject({
                            equals: v.optional(v.string()),
                            before: v.optional(v.string()),
                            after: v.optional(v.string()),
                            on_or_before: v.optional(v.string()),
                            on_or_after: v.optional(v.string()),
                          }),
                        }),
                      ]),
                    ),
                  }),
                ]),
              ),
            }),
          ]),
        ),
      }),
    ]),
  ),
  sorts: v.optional(
    v.pipe(
      v.array(
        v.looseObject({
          property: v.picklist(["sequence", "created_at"]),
          direction: v.picklist(["ascending", "descending"]),
        }),
      ),
      v.minLength(1),
      v.maxLength(2),
    ),
  ),
  start_cursor: v.optional(v.string()),
  page_size: v.optional(integer({ minimum: 1, maximum: 100 })),
})

export const QuerySessionEventsResponse: v.GenericSchema<unknown, T.QuerySessionEventsResponse> = v.looseObject({
  object: v.picklist(["list"]),
  type: v.picklist(["session_event"]),
  session_event: v.looseObject({}),
  results: v.pipe(
    v.array(
      v.union([
        v.looseObject({
          object: v.picklist(["session_event"]),
          id: v.string(),
          session_id: v.string(),
          sequence: integer({ minimum: 1 }),
          created_at: v.string(),
          type: v.picklist(["user.message"]),
          content: v.array(
            v.union([
              v.looseObject({
                type: v.picklist(["text"]),
                text: v.string(),
              }),
              v.looseObject({
                type: v.picklist(["file"]),
                name: v.string(),
                content_type: v.string(),
                url: v.string(),
                expiry_time: v.optional(v.string()),
              }),
            ]),
          ),
          created_by: v.nullable(
            v.union([
              v.looseObject({
                id: v.string(),
                type: v.picklist(["user", "bot"]),
              }),
            ]),
          ),
          metadata: v.nullable(v.union([v.record(v.string(), v.pipe(v.string(), v.maxLength(2000)))])),
        }),
        v.looseObject({
          object: v.picklist(["session_event"]),
          id: v.string(),
          session_id: v.string(),
          sequence: integer({ minimum: 1 }),
          created_at: v.string(),
          type: v.picklist(["agent.message"]),
          content: v.array(
            v.union([
              v.looseObject({
                type: v.picklist(["text"]),
                text: v.string(),
              }),
              v.looseObject({
                type: v.picklist(["file"]),
                name: v.string(),
                content_type: v.string(),
                url: v.string(),
                expiry_time: v.optional(v.string()),
              }),
            ]),
          ),
          created_by: v.nullable(
            v.union([
              v.looseObject({
                id: v.string(),
                type: v.picklist(["user", "bot"]),
              }),
            ]),
          ),
          metadata: v.nullable(
            v.union([
              v.looseObject({
                model: v.string(),
              }),
            ]),
          ),
        }),
        v.looseObject({
          object: v.picklist(["session_event"]),
          id: v.string(),
          session_id: v.string(),
          sequence: integer({ minimum: 1 }),
          created_at: v.string(),
          type: v.picklist(["agent.thinking"]),
          content: v.array(
            v.looseObject({
              type: v.picklist(["text"]),
              text: v.string(),
            }),
          ),
        }),
        v.looseObject({
          object: v.picklist(["session_event"]),
          id: v.string(),
          session_id: v.string(),
          sequence: integer({ minimum: 1 }),
          created_at: v.string(),
          type: v.picklist(["agent.tool_use"]),
          tool_name: v.string(),
        }),
        v.looseObject({
          object: v.picklist(["session_event"]),
          id: v.string(),
          session_id: v.string(),
          sequence: integer({ minimum: 1 }),
          created_at: v.string(),
          type: v.picklist(["agent.tool_result"]),
          tool_use_id: v.string(),
          tool_name: v.string(),
          is_error: v.boolean(),
        }),
        v.looseObject({
          object: v.picklist(["session_event"]),
          id: v.string(),
          session_id: v.string(),
          sequence: integer({ minimum: 1 }),
          created_at: v.string(),
          type: v.picklist(["session.status"]),
          status: v.picklist(["requires_action", "completed", "failed", "canceled", "terminated"]),
          required_actions: v.optional(
            v.array(
              v.looseObject({
                action_id: v.string(),
                title: v.string(),
                options: v.pipe(
                  v.array(
                    v.looseObject({
                      id: v.picklist(["approve", "reject"]),
                      label: v.string(),
                    }),
                  ),
                  v.maxLength(100),
                ),
              }),
            ),
          ),
          error: v.optional(
            v.looseObject({
              code: v.string(),
              message: v.string(),
              retryable: v.boolean(),
            }),
          ),
        }),
      ]),
    ),
    v.maxLength(100),
  ),
  has_more: v.boolean(),
  next_cursor: v.nullable(v.union([v.string()])),
})

export const CancelSessionRequest: v.GenericSchema<unknown, T.CancelSessionRequest> = v.looseObject({
  event_id: v.optional(v.string()),
})

export const CancelSessionResponse: v.GenericSchema<unknown, T.CancelSessionResponse> = v.looseObject({
  object: v.picklist(["session"]),
  id: v.string(),
  agent_id: v.string(),
  title: v.string(),
  status: v.picklist(["queued", "in_progress", "requires_action", "completed", "failed", "canceled", "terminated"]),
  created_at: v.string(),
  updated_at: v.string(),
  required_actions: v.optional(
    v.pipe(
      v.array(
        v.looseObject({
          action_id: v.string(),
          title: v.string(),
          options: v.pipe(
            v.array(
              v.looseObject({
                id: v.picklist(["approve", "reject"]),
                label: v.string(),
              }),
            ),
            v.maxLength(100),
          ),
        }),
      ),
      v.maxLength(100),
    ),
  ),
  error: v.optional(
    v.looseObject({
      code: v.string(),
      message: v.string(),
      retryable: v.boolean(),
    }),
  ),
})

export const schemas = {
  AgentIdParentForBlockBasedObjectResponse,
  AnnotationRequest,
  AnnotationResponse,
  ApiColor,
  ApiTranscriptionStatus,
  ArrayBasedPropertyValueResponse,
  ArrayPartialRollupValueResponse,
  AsyncTaskMcpOperationName,
  AsyncTaskRestOperationName,
  AudioBlockObjectResponse,
  BaseWebhookPayload,
  BlockIdCommentParentResponse,
  BlockIdParentForBlockBasedObjectResponse,
  BlockObjectRequest,
  BlockObjectRequestWithoutChildren,
  BlockObjectResponse,
  BlockObjectWithSingleLevelOfChildrenRequest,
  BoardViewConfigRequest,
  BoardViewConfigResponse,
  BookmarkBlockObjectResponse,
  BooleanFormulaPropertyResponse,
  BooleanFormulaPropertyValueResponse,
  BotInfoResponse,
  BotUserObjectResponse,
  BreadcrumbBlockObjectResponse,
  BulletedListItemBlockObjectResponse,
  ButtonPropertyConfigurationRequest,
  ButtonPropertyItemObjectResponse,
  ButtonSimplePropertyValueResponse,
  CalendarViewConfigRequest,
  CalendarViewConfigResponse,
  CalloutBlockObjectResponse,
  ChartAggregationRequest,
  ChartAggregationResponse,
  ChartReferenceLineRequest,
  ChartReferenceLineResponse,
  ChartViewConfigRequest,
  ChartViewConfigResponse,
  CheckboxDatabasePropertyConfigResponse,
  CheckboxGroupByConfigRequest,
  CheckboxGroupByConfigResponse,
  CheckboxPropertyConfigurationRequest,
  CheckboxPropertyFilter,
  CheckboxPropertyItemObjectResponse,
  CheckboxSimplePropertyValueResponse,
  ChildDatabaseBlockObjectResponse,
  ChildPageBlockObjectResponse,
  CodeBlockObjectResponse,
  ColumnBlockObjectResponse,
  ColumnBlockWithChildrenRequest,
  ColumnListBlockObjectResponse,
  ColumnListRequest,
  ColumnResponse,
  ColumnWithChildrenRequest,
  CommentCreatedWebhookPayload,
  CommentDeletedWebhookPayload,
  CommentObjectResponse,
  CommentParentResponse,
  CommentUpdatedWebhookPayload,
  ContentPositionSchema,
  ContentWithExpressionRequest,
  ContentWithRichTextAndColorAndListResponse,
  ContentWithRichTextAndColorRequest,
  ContentWithRichTextAndColorResponse,
  ContentWithRichTextColorAndIconRequest,
  ContentWithRichTextColorAndIconResponse,
  ContentWithRichTextColorAndIconUpdateRequest,
  ContentWithRichTextRequest,
  ContentWithSingleLevelOfChildrenRequest,
  ContentWithTableResponse,
  ContentWithTableRowRequest,
  ContentWithTableRowResponse,
  CoverConfigRequest,
  CoverConfigResponse,
  CreateDatabaseForViewRequest,
  CreateViewQueryRequest,
  CreateViewRequest,
  CreatedByDatabasePropertyConfigResponse,
  CreatedByPropertyConfigurationRequest,
  CreatedByPropertyItemObjectResponse,
  CreatedBySimplePropertyValueResponse,
  CreatedTimeDatabasePropertyConfigResponse,
  CreatedTimePropertyConfigurationRequest,
  CreatedTimePropertyItemObjectResponse,
  CreatedTimeSimplePropertyValueResponse,
  CustomEmojiPageIconRequest,
  CustomEmojiPageIconResponse,
  CustomEmojiResponse,
  DashboardRowResponse,
  DashboardViewConfigResponse,
  DashboardWidgetResponse,
  DataSourceContentUpdatedWebhookPayload,
  DataSourceCreatedWebhookPayload,
  DataSourceDeletedWebhookPayload,
  DataSourceMovedWebhookPayload,
  DataSourceObjectResponse,
  DataSourceParentResponse,
  DataSourceReferenceResponse,
  DataSourceSchemaUpdatedWebhookPayload,
  DataSourceUndeletedWebhookPayload,
  DataSourceViewObjectResponse,
  DataSourceViewReferenceResponse,
  DatabaseContentUpdatedWebhookPayload,
  DatabaseCreatedWebhookPayload,
  DatabaseDeletedWebhookPayload,
  DatabaseMovedWebhookPayload,
  DatabaseObjectResponse,
  DatabaseParentResponse,
  DatabasePropertyConfigResponse,
  DatabasePropertyConfigResponseCommon,
  DatabasePropertyRelationConfigResponse,
  DatabasePropertyRelationConfigResponseCommon,
  DatabaseSchemaUpdatedWebhookPayload,
  DatabaseUndeletedWebhookPayload,
  DateDatabasePropertyConfigResponse,
  DateFormulaPropertyResponse,
  DateFormulaPropertyValueResponse,
  DateGroupByConfigRequest,
  DateGroupByConfigResponse,
  DateOrRelativeDate,
  DatePartialRollupValueResponse,
  DatePropertyConfigurationRequest,
  DatePropertyFilter,
  DatePropertyItemObjectResponse,
  DateRequest,
  DateResponse,
  DateSimplePropertyValueResponse,
  DeletedViewQueryResponse,
  DividerBlockObjectResponse,
  DualPropertyDatabasePropertyRelationConfigResponse,
  EmailDatabasePropertyConfigResponse,
  EmailPropertyConfigurationRequest,
  EmailPropertyItemObjectResponse,
  EmailSimplePropertyValueResponse,
  EmbedBlockObjectResponse,
  EmbedFileUploadRequest,
  EmojiPageIconRequest,
  EmojiPageIconResponse,
  EmojiRequest,
  EmptyObject,
  EquationBlockObjectResponse,
  EquationRichTextItemRequest,
  EquationRichTextItemResponse,
  ErrorApi400,
  ErrorApi401,
  ErrorApi403,
  ErrorApi404,
  ErrorApi406,
  ErrorApi409,
  ErrorApi429,
  ErrorApi500,
  ErrorApi503,
  ErrorApi504,
  ErrorApi529,
  ErrorOauth400,
  ErrorOauth401,
  ErrorOauth403,
  ErrorOauth500,
  ExistencePropertyFilter,
  ExpressionObjectResponse,
  ExternalFileRequest,
  ExternalInternalOrExternalFileWithNameResponse,
  ExternalMediaContentWithFileAndCaptionResponse,
  ExternalMediaContentWithFileNameAndCaptionResponse,
  ExternalPageCoverRequest,
  ExternalPageCoverResponse,
  ExternalPageIconRequest,
  ExternalPageIconResponse,
  FileBlockObjectResponse,
  FileInternalOrExternalFileWithNameResponse,
  FileMediaContentWithFileAndCaptionResponse,
  FileMediaContentWithFileNameAndCaptionResponse,
  FilePageCoverResponse,
  FilePageIconResponse,
  FileUploadCompletedWebhookPayload,
  FileUploadCreatedWebhookPayload,
  FileUploadExpiredWebhookPayload,
  FileUploadIdRequest,
  FileUploadObjectResponse,
  FileUploadPageCoverRequest,
  FileUploadPageIconRequest,
  FileUploadUploadFailedWebhookPayload,
  FileUploadWithOptionalNameRequest,
  FilesDatabasePropertyConfigResponse,
  FilesPropertyConfigurationRequest,
  FilesPropertyItemObjectResponse,
  FilesSimplePropertyValueResponse,
  FormViewConfigRequest,
  FormViewConfigResponse,
  FormulaCheckboxSubGroupByRequest,
  FormulaCheckboxSubGroupByResponse,
  FormulaDatabasePropertyConfigResponse,
  FormulaDateSubGroupByRequest,
  FormulaDateSubGroupByResponse,
  FormulaGroupByConfigRequest,
  FormulaGroupByConfigResponse,
  FormulaNumberSubGroupByRequest,
  FormulaNumberSubGroupByResponse,
  FormulaPropertyConfigurationRequest,
  FormulaPropertyFilter,
  FormulaPropertyItemObjectResponse,
  FormulaPropertyResponse,
  FormulaPropertyValueResponse,
  FormulaSimplePropertyValueResponse,
  FormulaSubGroupByResponse,
  FormulaTextSubGroupByRequest,
  FormulaTextSubGroupByResponse,
  GalleryViewConfigRequest,
  GalleryViewConfigResponse,
  GroupByConfigRequest,
  GroupByConfigResponse,
  GroupFilterOperatorArray,
  GroupObjectRequest,
  GroupObjectResponse,
  GroupSortRequest,
  GroupSortResponse,
  HeaderContentWithRichTextAndColorRequest,
  HeaderContentWithRichTextAndColorResponse,
  HeaderContentWithSingleLevelOfChildrenRequest,
  Heading1BlockObjectResponse,
  Heading2BlockObjectResponse,
  Heading3BlockObjectResponse,
  Heading4BlockObjectResponse,
  IconPageIconRequest,
  IconPageIconResponse,
  IdObjectResponse,
  IdRequest,
  IdResponse,
  ImageBlockObjectResponse,
  InitialDataSourceRequest,
  InternalFileRequest,
  InternalFileResponse,
  InternalOrExternalFileWithNameRequest,
  InternalOrExternalFileWithNameResponse,
  InternalOrExternalFileWithNameResponseCommon,
  LanguageRequest,
  LastEditedByDatabasePropertyConfigResponse,
  LastEditedByPropertyConfigurationRequest,
  LastEditedByPropertyItemObjectResponse,
  LastEditedBySimplePropertyValueResponse,
  LastEditedTimeDatabasePropertyConfigResponse,
  LastEditedTimePropertyConfigurationRequest,
  LastEditedTimePropertyItemObjectResponse,
  LastEditedTimeSimplePropertyValueResponse,
  LastVisitedTimePropertyConfigurationRequest,
  LinkMentionResponse,
  LinkPreviewBlockObjectResponse,
  LinkPreviewMentionResponse,
  LinkToPageBlockObjectResponse,
  ListViewConfigRequest,
  ListViewConfigResponse,
  LocationPropertyConfigurationRequest,
  MapViewConfigRequest,
  MapViewConfigResponse,
  MediaContentWithFileAndCaptionRequest,
  MediaContentWithFileAndCaptionResponse,
  MediaContentWithFileNameAndCaptionRequest,
  MediaContentWithFileNameAndCaptionResponse,
  MediaContentWithUrlAndCaptionRequest,
  MediaContentWithUrlAndCaptionResponse,
  MediaContentWithUrlResponse,
  MeetingNotesBlockObjectResponse,
  MeetingNotesPropertyFilter,
  MentionRichTextItemRequest,
  MentionRichTextItemResponse,
  MultiSelectDatabasePropertyConfigResponse,
  MultiSelectPropertyConfigurationRequest,
  MultiSelectPropertyFilter,
  MultiSelectPropertyItemObjectResponse,
  MultiSelectSimplePropertyValueResponse,
  NonTerminalAsyncTaskStatus,
  NoticonColor,
  NoticonIconResponse,
  NoticonName,
  NumberDatabasePropertyConfigResponse,
  NumberFormat,
  NumberFormulaPropertyResponse,
  NumberFormulaPropertyValueResponse,
  NumberGroupByConfigRequest,
  NumberGroupByConfigResponse,
  NumberPartialRollupValueResponse,
  NumberPropertyConfigurationRequest,
  NumberPropertyFilter,
  NumberPropertyItemObjectResponse,
  NumberSimplePropertyValueResponse,
  NumberedListFormat,
  NumberedListItemBlockObjectResponse,
  PageContentUpdatedWebhookPayload,
  PageCoverRequest,
  PageCoverResponse,
  PageCreatedWebhookPayload,
  PageDeletedWebhookPayload,
  PageIconRequest,
  PageIconResponse,
  PageIdCommentParentResponse,
  PageIdParentForBlockBasedObjectResponse,
  PageLockedWebhookPayload,
  PageMarkdownResponse,
  PageMovedWebhookPayload,
  PageObjectResponse,
  PageOrDataSourceListResponse,
  PagePositionSchema,
  PagePropertiesRequest,
  PagePropertiesUpdatedWebhookPayload,
  PagePropertyValueWithIdResponse,
  PageReferenceResponse,
  PageTranscriptionBlockTranscriptDeletedWebhookPayload,
  PageUndeletedWebhookPayload,
  PageUnlockedWebhookPayload,
  PageWriteNotificationsSchema,
  ParagraphBlockObjectResponse,
  ParagraphWithSingleLevelOfChildrenRequest,
  ParentForBlockBasedObjectResponse,
  ParentOfDataSourceRequest,
  ParentOfDataSourceResponse,
  ParentOfDatabaseResponse,
  PartialBlockObjectResponse,
  PartialCommentObjectResponse,
  PartialDataSourceObjectResponse,
  PartialDataSourceViewObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
  PartialRollupPropertyResponse,
  PartialRollupValueResponse,
  PartialRollupValueResponseCommon,
  PartialSelectPropertyValueResponse,
  PartialSelectResponse,
  PartialUserObjectRequest,
  PartialUserObjectResponse,
  PdfBlockObjectResponse,
  PeopleArrayBasedPropertyValueResponse,
  PeopleDatabasePropertyConfigResponse,
  PeoplePropertyConfigurationRequest,
  PeoplePropertyFilter,
  PeoplePropertyItemObjectResponse,
  PersonGroupByConfigRequest,
  PersonGroupByConfigResponse,
  PersonIdOrMe,
  PersonUserObjectResponse,
  PhoneNumberDatabasePropertyConfigResponse,
  PhoneNumberPropertyConfigurationRequest,
  PhoneNumberPropertyItemObjectResponse,
  PhoneNumberSimplePropertyValueResponse,
  PlacePropertyConfigurationRequest,
  PlacePropertyItemObjectResponse,
  PlacePropertyValueResponse,
  PlaceSimplePropertyValueResponse,
  PropertyConfigurationRequest,
  PropertyConfigurationRequestCommon,
  PropertyDescriptionRequest,
  PropertyFilter,
  PropertyItemListResponse,
  PropertyItemObjectResponse,
  PropertyItemPropertyItemListResponse,
  PropertyOrTimestampFilter,
  PropertyOrTimestampFilterArray,
  PropertySortResponse,
  PublicApiAsyncTaskStatusResultJsonValue,
  PublicApiCommonErrorResponse,
  QuickFilterConditionRequest,
  QuickFilterConditionResponse,
  QuoteBlockObjectResponse,
  RelationArrayBasedPropertyValueResponse,
  RelationDatabasePropertyConfigResponse,
  RelationGroupByConfigRequest,
  RelationGroupByConfigResponse,
  RelationItemPropertyValueResponse,
  RelationPropertyConfigurationRequest,
  RelationPropertyFilter,
  RelationPropertyItemObjectResponse,
  RelativeDateValue,
  RequestStatusResponse,
  RichTextArrayBasedPropertyValueResponse,
  RichTextDatabasePropertyConfigResponse,
  RichTextItemRequest,
  RichTextItemRequestCommon,
  RichTextItemResponse,
  RichTextItemResponseCommon,
  RichTextPropertyConfigurationRequest,
  RichTextPropertyItemObjectResponse,
  RollupDatabasePropertyConfigResponse,
  RollupFunction,
  RollupPropertyConfigurationRequest,
  RollupPropertyFilter,
  RollupPropertyItemObjectResponse,
  RollupSubfilterPropertyFilter,
  SelectColor,
  SelectDatabasePropertyConfigResponse,
  SelectGroupByConfigRequest,
  SelectGroupByConfigResponse,
  SelectPropertyConfigurationRequest,
  SelectPropertyFilter,
  SelectPropertyItemObjectResponse,
  SelectPropertyResponse,
  SelectSimplePropertyValueResponse,
  SessionAgentIdFilter,
  SessionIdFilter,
  SessionNestedFilter,
  SessionStatusFilter,
  SessionTimestampFilter,
  SimpleOrArrayPropertyValueResponse,
  SimplePropertyValueResponse,
  SinglePropertyDatabasePropertyRelationConfigResponse,
  SortDirectionRequest,
  StatusDatabasePropertyConfigResponse,
  StatusGroupByConfigRequest,
  StatusGroupByConfigResponse,
  StatusGroupNames,
  StatusOptionGroup,
  StatusOptionRequest,
  StatusOptionRequestArray,
  StatusOptionUpdateRequest,
  StatusOptionUpdateRequestArray,
  StatusOptionUpdateRequestCommon,
  StatusPropertyConfigRequest,
  StatusPropertyConfigUpdateRequest,
  StatusPropertyConfigurationRequest,
  StatusPropertyFilter,
  StatusPropertyItemObjectResponse,
  StatusPropertyResponse,
  StatusSimplePropertyValueResponse,
  StatusValueFilter,
  StringFormulaPropertyResponse,
  StringFormulaPropertyValueResponse,
  StringOrStringArray,
  StringRequest,
  SubtaskConfigRequest,
  SubtaskConfigResponse,
  SyncedBlockBlockObjectResponse,
  TabBlockObjectResponse,
  TabItemRequestWithSingleLevelOfChildren,
  TabItemRequestWithoutChildren,
  TabRequestWithNestedTabItemChildren,
  TabRequestWithTabItemChildren,
  TableBlockObjectResponse,
  TableOfContentsBlockObjectResponse,
  TableRequestWithTableRowChildren,
  TableRowBlockObjectResponse,
  TableRowRequest,
  TableViewConfigRequest,
  TableViewConfigResponse,
  TemplateBlockObjectResponse,
  TemplateMentionDateTemplateMentionRequest,
  TemplateMentionDateTemplateMentionResponse,
  TemplateMentionRequest,
  TemplateMentionResponse,
  TemplateMentionUserTemplateMentionRequest,
  TemplateMentionUserTemplateMentionResponse,
  TemplateTimezone,
  TextGroupByConfigRequest,
  TextGroupByConfigResponse,
  TextPropertyFilter,
  TextRequest,
  TextRichTextItemRequest,
  TextRichTextItemResponse,
  TimeZoneRequest,
  TimelineArrowsByRequest,
  TimelineArrowsByResponse,
  TimelinePreferenceRequest,
  TimelinePreferenceResponse,
  TimelineViewConfigRequest,
  TimelineViewConfigResponse,
  TimestampCreatedTimeFilter,
  TimestampFilter,
  TimestampLastEditedTimeFilter,
  TimestampSortResponse,
  TitleArrayBasedPropertyValueResponse,
  TitleDatabasePropertyConfigResponse,
  TitleObjectResponse,
  TitlePropertyConfigurationRequest,
  TitlePropertyItemObjectResponse,
  ToDoBlockObjectResponse,
  ToggleBlockObjectResponse,
  TranscriptionBlockResponse,
  TranscriptionCalendarEventResponse,
  TranscriptionChildrenResponse,
  TranscriptionRecordingResponse,
  UniqueIdDatabasePropertyConfigResponse,
  UniqueIdPropertyConfigurationRequest,
  UniqueIdPropertyItemObjectResponse,
  UniqueIdPropertyValueResponse,
  UniqueIdSimplePropertyValueResponse,
  UnsupportedBlockObjectResponse,
  UnsupportedFormulaPropertyResponse,
  UnsupportedFormulaPropertyValueResponse,
  UnsupportedPartialRollupValueResponse,
  UpdateEmbedFileUploadRequest,
  UpdateMediaContentWithFileAndCaptionRequest,
  UpdateMediaContentWithFileNameAndCaptionRequest,
  UpdateMediaContentWithUrlAndCaptionRequest,
  UpdateViewRequest,
  UrlDatabasePropertyConfigResponse,
  UrlPropertyConfigurationRequest,
  UrlPropertyItemObjectResponse,
  UrlSimplePropertyValueResponse,
  UserObjectResponse,
  UserObjectResponseCommon,
  UserValueResponse,
  VerificationPropertyConfigurationRequest,
  VerificationPropertyDoesNotEqualFilter,
  VerificationPropertyItemObjectResponse,
  VerificationPropertyResponse,
  VerificationPropertyStatusFilter,
  VerificationPropertyUnverifiedResponse,
  VerificationPropertyValueResponse,
  VerificationSimplePropertyValueResponse,
  VideoBlockObjectResponse,
  ViewConfigRequest,
  ViewConfigResponse,
  ViewCreatedWebhookPayload,
  ViewDeletedWebhookPayload,
  ViewFilterRequest,
  ViewFilterResponse,
  ViewPositionRequest,
  ViewPropertyConfigRequest,
  ViewPropertyConfigResponse,
  ViewPropertySortRequest,
  ViewPropertySortsRequest,
  ViewQueryResponse,
  ViewSortRequest,
  ViewSortResponse,
  ViewSortsRequest,
  ViewTypeRequest,
  ViewUpdatedWebhookPayload,
  WebhookCommentEntity,
  WebhookDatabaseEventEntity,
  WebhookExternalBlock,
  WebhookFileUploadEntity,
  WebhookPageEntity,
  WebhookParentBlock,
  WebhookUpdatedBlock,
  WebhookViewEntity,
  WidgetPlacementRequest,
  WorkspaceParentForBlockBasedObjectResponse,
  GetUsersResponse,
  PostPageRequest,
  PostPageResponse,
  RetrieveAPageResponse,
  PatchPageRequest,
  PatchPageResponse,
  MovePageRequest,
  MovePageResponse,
  RetrieveAPagePropertyResponse,
  UpdatePageMarkdownRequest,
  RetrieveAsyncTaskResponse,
  RetrieveABlockResponse,
  UpdateABlockRequest,
  UpdateABlockResponse,
  DeleteABlockResponse,
  GetBlockChildrenResponse,
  PatchBlockChildrenRequest,
  PatchBlockChildrenResponse,
  RetrieveADataSourceResponse,
  UpdateADataSourceRequest,
  UpdateADataSourceResponse,
  PostDatabaseQueryRequest,
  CreateADatabaseRequest,
  CreateADatabaseResponse,
  ListDataSourceTemplatesResponse,
  RetrieveDatabaseResponse,
  UpdateDatabaseRequest,
  UpdateDatabaseResponse,
  CreateDatabaseRequest,
  CreateDatabaseResponse,
  PostSearchRequest,
  ListCommentsResponse,
  CreateACommentRequest,
  CreateACommentResponse,
  RetrieveCommentResponse,
  UpdateACommentRequest,
  UpdateACommentResponse,
  DeleteACommentResponse,
  ListFileUploadsResponse,
  CreateFileRequest,
  ListCustomEmojisResponse,
  ListViewsResponse,
  CreateViewResponse,
  RetrieveAViewResponse,
  UpdateAViewResponse,
  GetViewQueryResultsResponse,
  CreateMeetingNoteRequest,
  CreateMeetingNoteResponse,
  QueryMeetingNotesRequest,
  QueryMeetingNotesResponse,
  QueryAgentsRequest,
  QueryAgentsResponse,
  GetAgentResponse,
  UpdateAgentRequest,
  UpdateAgentResponse,
  DeleteAgentResponse,
  GetAgentInsightsResponse,
  UpdateAgentStatusRequest,
  UpdateAgentStatusResponse,
  UpdateAgentCreditLimitRequest,
  UpdateAgentCreditLimitResponse,
  AgentBatchRequest,
  AgentBatchResponse,
  ListSkillsPluginsResponse,
  GetPluginDirectoryResponse,
  GetSkillDirectoryResponse,
  UpdateSessionRequest,
  UpdateSessionResponse,
  RetrieveSessionResponse,
  QuerySessionsRequest,
  QuerySessionsResponse,
  QuerySessionEventsRequest,
  QuerySessionEventsResponse,
  CancelSessionRequest,
  CancelSessionResponse,
} as const
