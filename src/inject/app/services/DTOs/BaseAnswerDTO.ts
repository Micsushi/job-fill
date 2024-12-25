import { Answer106 } from '@src/shared/utils/types';
import { ReactNode } from 'react';
// import { AnswerDataTypes_Any } from './types';

export default abstract class BaseAnswerDTO<AnswerDataType> {
  answer: AnswerDataType;
  id: number;
  matchType: string;
  section: string;
  fieldName: string;
  fieldType: string;

  path: {
    section: string;
    fieldName: string;
    fieldType: string;
  };

  constructor({ answer, id, matchType, section, fieldName, fieldType }) {
    this.answer = answer;
    this.id = id;
    this.matchType = matchType;
    this.section = section;
    this.fieldName = fieldName;
    this.path = {
      section,
      fieldName,
      fieldType,
    };
  }

  static from106(answer106: Answer106) {
    const {
      answer,
      id,
      matchType,
      path: { section, fieldName, fieldType },
    } = answer106;
    // @ts-expect-error this should work...
    return new this({ answer, id, matchType, section, fieldName, fieldType });
  }

  get match():
    | { type: 'exact'; score: null }
    | { type: 'Similar'; score: number } {
    const split = this.matchType.split(': ');
    if (split.length === 1) {
      return { type: 'exact', score: null };
    } else if (split.length === 2) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_type, scoreString] = split;
      return {
        type: 'Similar',
        score: parseFloat(scoreString),
      };
    }
  }

  public get forDisplay(): ReactNode {
    return this.answer.toString();
  }
}
