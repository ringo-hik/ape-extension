/**
 * �X �9� ��
 * 
 * L��� �X �9� l
 */

import { CommandResult } from '../../../types/CommandTypes';

/**
 * �X �9� �
 * @param commandId �9� ID
 * @returns �9� � ��
 */
export async function mockExecuteCommand(commandId: string): Promise<CommandResult> {
  console.log(`�X �9� �: ${commandId}`);
  
  // � 1� �� X
  return {
    success: true,
    content: `�9� ${commandId} 1�<\ �(`,
    displayMode: 'text'
  };
}

/**
 * �X Git �9� �
 */
export async function mockGitCommand(): Promise<CommandResult> {
  return {
    success: true,
    content: `Git �9� �(\n- � �X: master\n- �� |: 3\n- �  D(: `,
    displayMode: 'text'
  };
}

/**
 * �X Jira �9� �
 */
export async function mockJiraCommand(): Promise<CommandResult> {
  return {
    success: true,
    content: `Jira �9� �(\n- t�: APE-123\n- ��: ĉ \n- ���: ���`,
    displayMode: 'text'
  };
}

/**
 * �X SWDP �9� �
 */
export async function mockSwdpCommand(): Promise<CommandResult> {
  return {
    success: true,
    content: `SWDP �9� �(\n- L� ID: 12345\n- ��: 1�\n- �� �: 2� 30`,
    displayMode: 'text'
  };
}

/**
 * �X Pocket �9� �
 */
export async function mockPocketCommand(): Promise<CommandResult> {
  return {
    success: true,
    content: `Pocket �9� �(\n-  � 8: 5\n- \� 8: README.md`,
    displayMode: 'text'
  };
}

/**
 * �X API �9� �
 */
export async function mockApiCommand(): Promise<CommandResult> {
  return {
    success: true,
    content: `API �9� �(\n- ��: �(\n- Q� �: 120ms`,
    displayMode: 'text'
  };
}

/**
 * �X �x �] �9� �
 */
export async function mockModelsCommand(): Promise<CommandResult> {
  return {
    success: true,
    content: `�x �] �9� �(\n- Claude 3 Haiku\n- Claude 3 Sonnet\n- Claude 3 Opus\n- Gemini 1.5 Pro`,
    displayMode: 'text'
  };
}

/**
 * �X ��� �9� �
 */
export async function mockStreamCommand(): Promise<CommandResult> {
  return {
    success: true,
    content: `��� �9� �(\n- �l : 25\n-  �p: 512\n- �� �: 1.2`,
    displayMode: 'text'
  };
}

/**
 * �X �9� x�� �
 */
export const mockCommandHandlers: Record<string, () => Promise<CommandResult>> = {
  'test.git': mockGitCommand,
  'test.jira': mockJiraCommand,
  'test.swdp': mockSwdpCommand,
  'test.pocket': mockPocketCommand,
  'api.test': mockApiCommand,
  'api.models': mockModelsCommand,
  'api.stream': mockStreamCommand,
  'mode.toggle': async () => ({
    success: true,
    content: 'APE ��  Xȵ��',
    displayMode: 'text'
  }),
  'mode.dev': async () => ({
    success: true,
    content: '�5 � ��  Xȵ��',
    displayMode: 'text'
  }),
  'chat.clear': async () => ({
    success: true,
    content: 'D ��t ��L���',
    displayMode: 'text'
  }),
  'chat.save': async () => ({
    success: true,
    content: 'D ��t  �ȵ��',
    displayMode: 'text'
  }),
  'chat.history': async () => ({
    success: true,
    content: 'D ����  \�ȵ��',
    displayMode: 'text'
  })
};