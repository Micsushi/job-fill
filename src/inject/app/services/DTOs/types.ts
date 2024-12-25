export type AnswerDataTypes_RelativeDate = string;
export type AnswerDataTypes_MonthDayYear = [string, string, string] | AnswerDataTypes_RelativeDate;
export type AnswerDataTypes_MonthYear = [string, string];
export type AnswerDataTypes_File = {
  body: string;
  lastModified: number;
  name: string;
  size: number;
  type: string;
};
export type AnswerDataTypes_Any =
  | AnswerDataTypes_MonthDayYear
  | AnswerDataTypes_MonthYear
  | AnswerDataTypes_File
  | AnswerDataTypes_File[]
  | string
  | string[]
  | boolean
  | number;


