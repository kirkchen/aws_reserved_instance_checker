// TODO: Hack for @slack/client, replace this with official package
declare module '@slack/client';

interface SlackMessage {
    username?: string;

    attachments: SlackMessageAttachment[];
}

interface SlackMessageAttachment {
    title?: string;

    color?: string;

    fields: SlackMessageAttachmentField[];

    footer?: string;
}

interface SlackMessageAttachmentField {
    title?: string;

    value?: string;

    short: boolean;
}