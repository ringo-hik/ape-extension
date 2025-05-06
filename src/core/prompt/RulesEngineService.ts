/**
 * 규칙 엔진 서비스
 * 
 * 컨텍스트 기반 규칙 평가 및 적용 기능 제공
 * 프롬프트 생성을 위한 규칙 관리 및 평가
 */

import { 
  IRulesEngine, 
  Rule, 
  RuleCondition, 
  PromptContext 
} from './PromptTypes';
import { IConfigLoader } from '../../types/ConfigTypes';

/**
 * 규칙 엔진 서비스 클래스
 */
export class RulesEngineService implements IRulesEngine {
  /**
   * 규칙 목록
   */
  private rules: Rule[] = [];
  
  /**
   * RulesEngineService 생성자
   * @param configLoader 설정 로더
   */
  constructor(private configLoader: IConfigLoader) {
    
    this.registerDefaultRules();
  }
  
  /**
   * 기본 규칙 등록
   */
  private registerDefaultRules(): void {
    
    this.registerRule({
      id: 'code_generation_rule',
      name: '코드 생성 규칙',
      priority: 100,
      conditions: [
        {
          field: 'input',
          operator: 'contains',
          value: '생성'
        },
        {
          field: 'languageId',
          operator: 'exists',
          value: true
        }
      ],
      templateId: 'code_generation',
      tags: ['code', 'generation']
    });
    
    
    this.registerRule({
      id: 'code_refactoring_rule',
      name: '코드 리팩토링 규칙',
      priority: 90,
      conditions: [
        {
          field: 'input',
          operator: 'contains',
          value: '리팩토링'
        },
        {
          field: 'selectedCode',
          operator: 'exists',
          value: true
        }
      ],
      templateId: 'code_refactoring',
      tags: ['code', 'refactoring']
    });
    
    
    this.registerRule({
      id: 'bug_fixing_rule',
      name: '버그 해결 규칙',
      priority: 80,
      conditions: [
        {
          field: 'input',
          operator: 'contains',
          value: '버그'
        },
        {
          field: 'selectedCode',
          operator: 'exists',
          value: true
        }
      ],
      templateId: 'bug_fixing',
      tags: ['code', 'bug', 'fixing']
    });
  }
  
  /**
   * 규칙 등록
   * @param rule 규칙
   * @returns 등록 성공 여부
   */
  registerRule(rule: Rule): boolean {
    try {
      
      const existingRuleIndex = this.rules.findIndex(r => r.id === rule.id);
      
      if (existingRuleIndex >= 0) {
        
        this.rules[existingRuleIndex] = rule;
      } else {
        
        this.rules.push(rule);
      }
      
      
      this.rules.sort((a, b) => b.priority - a.priority);
      
      return true;
    } catch (error) {
      console.error(`규칙 등록 실패 (${rule.id}):`, error);
      return false;
    }
  }
  
  /**
   * 컨텍스트에 적용 가능한 규칙 조회
   * @param context 컨텍스트
   * @returns 적용 가능한 규칙 목록
   */
  getApplicableRules(context: PromptContext): Rule[] {
    try {
      
      return this.rules.filter(rule => {
        return rule.conditions.every(condition => this.evaluateCondition(condition, context));
      });
    } catch (error) {
      console.error('적용 가능한 규칙 조회 중 오류 발생:', error);
      return [];
    }
  }
  
  /**
   * 규칙 조건 평가
   * @param condition 조건
   * @param context 컨텍스트
   * @returns 조건 만족 여부
   */
  evaluateCondition(condition: RuleCondition, context: PromptContext): boolean {
    try {
      
      let fieldValue: any;
      
      if (condition.field.includes('.')) {
        
        const parts = condition.field.split('.');
        let current: any = context;
        
        for (const part of parts) {
          if (current === undefined || current === null) {
            return false;
          }
          current = current[part as keyof typeof current];
        }
        
        fieldValue = current;
      } else {
        
        fieldValue = context[condition.field as keyof PromptContext];
      }
      
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
          
        case 'notEquals':
          return fieldValue !== condition.value;
          
        case 'contains':
          if (typeof fieldValue !== 'string') {
            return false;
          }
          return fieldValue.toLowerCase().includes(
            typeof condition.value === 'string' ? condition.value.toLowerCase() : String(condition.value)
          );
          
        case 'startsWith':
          if (typeof fieldValue !== 'string') {
            return false;
          }
          return fieldValue.toLowerCase().startsWith(
            typeof condition.value === 'string' ? condition.value.toLowerCase() : String(condition.value)
          );
          
        case 'endsWith':
          if (typeof fieldValue !== 'string') {
            return false;
          }
          return fieldValue.toLowerCase().endsWith(
            typeof condition.value === 'string' ? condition.value.toLowerCase() : String(condition.value)
          );
          
        case 'regex':
          if (typeof fieldValue !== 'string') {
            return false;
          }
          return new RegExp(condition.value).test(fieldValue);
          
        case 'exists':
          return condition.value ? (fieldValue !== undefined && fieldValue !== null) : 
                                  (fieldValue === undefined || fieldValue === null);
                                  
        default:
          console.warn(`지원하지 않는 조건 연산자: ${condition.operator}`);
          return false;
      }
    } catch (error) {
      console.error(`조건 평가 중 오류 발생:`, error);
      return false;
    }
  }
}