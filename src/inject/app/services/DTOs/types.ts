export type AnswerDataTypes_RelativeDate = string;
export type AnswerDataTypes_MonthYear = [string, string];
type AbsoluteDate = [string, string, string];
type RelativeDate = 'today';
export type AnswerDataTypes_MonthDayYear =
  | {
      relative: true;
      value: RelativeDate;
    }
  | {
      relative: false;
      value: AbsoluteDate;
    };

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
