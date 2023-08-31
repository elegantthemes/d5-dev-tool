import {
  ClipboardItem,
  ClipboardType,
} from "@divi/clipboard";

export interface ClipboardPayloadItemProps {
  name: keyof ClipboardItem['payload'];
  values: ClipboardItem['payload'][keyof ClipboardItem['payload']];
}

export interface ClipboardItemProps {
  clipboardType: ClipboardItem['clipboardType'];
  origin: ClipboardItem['origin'];
  payload: ClipboardItem['payload'];
  itemIndex: number;
}

export interface ContentClipboardProps {
  clipboardItems: ClipboardItem[];
}