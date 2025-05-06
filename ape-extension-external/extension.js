// APE Extension - Agentic Pipeline Engine
// Generated: 2025-05-06T17:02:54.898Z
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// extension.env.js
var require_extension_env = __commonJS({
  "extension.env.js"(exports, module2) {
    "use strict";
    module2.exports = {
      ENV_MODE: "auto",
      API_ENDPOINTS: {
        NARRANS_API: "https://api-se-dev.narrans.samsungds.net/v1/chat/completions",
        LLAMA4_API: "http://apigw-stg.samsungds.net:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions",
        LLAMA4_MAVERICK_API: "http://apigw-stg.samsungds.net:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions",
        LLAMA4_SCOUT_API: "http://apigw-stg.samsungds.net:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions",
        OPENROUTER_API: "https://openrouter.ai/api/v1/chat/completions",
        SWDP_API: "http://swdp-api-dev.samsungds.net/api/v1",
        JIRA_API: "http://jira-api.samsungds.net/rest/api/latest",
        BITBUCKET_API: "http://bitbucket-api.samsungds.net/rest/api/latest"
      },
      API_KEYS: {
        OPENROUTER_API_KEY: "",
        NARRANS_API_KEY: "",
        LLAMA4_API_KEY: ""
      },
      DEFAULT_MODEL: "gemini-2.5-flash",
      AVAILABLE_MODELS: [
        {
          id: "narrans",
          name: "NARRANS",
          provider: "custom",
          apiUrl: "https://api-se-dev.narrans.samsungds.net/v1/chat/completions",
          contextWindow: 1e4,
          maxTokens: 1e4,
          temperature: 0
        },
        {
          id: "llama-4-maverick",
          name: "Llama 4 Maverick",
          provider: "custom",
          apiUrl: "http://apigw-stg.samsungds.net:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions",
          contextWindow: 5e4,
          maxTokens: 5e4,
          temperature: 0
        },
        {
          id: "llama-4-scout",
          name: "Llama 4 Scout",
          provider: "custom",
          apiUrl: "http://apigw-stg.samsungds.net:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions",
          contextWindow: 5e4,
          maxTokens: 5e4,
          temperature: 0
        },
        {
          id: "gemini-2.5-flash",
          name: "Google Gemini 2.5 Flash",
          provider: "openrouter",
          apiUrl: "https://openrouter.ai/api/v1/chat/completions",
          apiModel: "google/gemini-2.5-flash-preview",
          contextWindow: 32e3,
          maxTokens: 8192,
          temperature: 0.7
        },
        {
          id: "phi-4-reasoning-plus",
          name: "Microsoft Phi-4",
          provider: "openrouter",
          apiUrl: "https://openrouter.ai/api/v1/chat/completions",
          apiModel: "microsoft/phi-4-reasoning-plus",
          contextWindow: 32e3,
          maxTokens: 8192,
          temperature: 0.7
        },
        {
          id: "local",
          name: "\uB85C\uCEEC \uC2DC\uBBAC\uB808\uC774\uC158",
          provider: "local",
          temperature: 0.7
        }
      ],
      USE_MOCK_DATA: false,
      FORCE_SSL_BYPASS: true
    };
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode9 = __toESM(require("vscode"));

// src/core/CoreService.ts
var import_events7 = require("events");

// src/core/di/Container.ts
var DIContainer = class {
  /**
   * 생성자 - 직접 호출 방지를 위해 private 지정
   */
  constructor() {
    this.services = /* @__PURE__ */ new Map();
    this.providers = /* @__PURE__ */ new Map();
    this.options = /* @__PURE__ */ new Map();
  }
  /**
   * 싱글톤 인스턴스 반환
   * @returns DIContainer 싱글톤 인스턴스
   */
  static getInstance() {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
  /**
   * 인스턴스 등록
   * @param id 서비스 ID
   * @param instance 서비스 인스턴스
   */
  register(id, instance) {
    this.services.set(id, instance);
  }
  /**
   * 서비스 제공자 등록
   * @param id 서비스 ID
   * @param provider 서비스 제공자 (팩토리 함수)
   * @param options 서비스 옵션
   */
  registerProvider(id, provider, options = { singleton: true }) {
    this.providers.set(id, provider);
    this.options.set(id, options);
  }
  /**
   * 서비스 인스턴스 반환
   * @param id 서비스 ID
   * @returns 서비스 인스턴스
   */
  get(id) {
    if (this.services.has(id)) {
      return this.services.get(id);
    }
    if (this.providers.has(id)) {
      const provider = this.providers.get(id);
      const options = this.options.get(id) || { singleton: true };
      const instance = provider();
      if (options.singleton) {
        this.services.set(id, instance);
      }
      return instance;
    }
    throw new Error(`\uC11C\uBE44\uC2A4\uAC00 \uB4F1\uB85D\uB418\uC9C0 \uC54A\uC74C: ${id}`);
  }
  /**
   * 서비스 인스턴스 존재 여부 확인
   * @param id 서비스 ID
   * @returns 존재 여부
   */
  has(id) {
    return this.services.has(id) || this.providers.has(id);
  }
  /**
   * 등록된 모든 서비스 ID 목록 반환
   * @returns 서비스 ID 배열
   */
  getRegisteredServices() {
    return [
      ...Array.from(this.services.keys()),
      ...Array.from(this.providers.keys()).filter((id) => !this.services.has(id))
    ];
  }
  /**
   * 서비스 등록 해제
   * @param id 서비스 ID
   */
  unregister(id) {
    this.services.delete(id);
    this.providers.delete(id);
    this.options.delete(id);
  }
  /**
   * 모든 서비스 등록 해제
   */
  clear() {
    this.services.clear();
    this.providers.clear();
    this.options.clear();
  }
};
var container = DIContainer.getInstance();

// src/types/CommandTypes.ts
var CommandDomain = /* @__PURE__ */ ((CommandDomain2) => {
  CommandDomain2["NONE"] = "none";
  CommandDomain2["GIT"] = "git";
  CommandDomain2["DOC"] = "doc";
  CommandDomain2["JIRA"] = "jira";
  CommandDomain2["POCKET"] = "pocket";
  CommandDomain2["VAULT"] = "vault";
  CommandDomain2["RULES"] = "rules";
  CommandDomain2["SWDP"] = "swdp";
  return CommandDomain2;
})(CommandDomain || {});

// src/core/command/CommandParserService.ts
var CommandParserService = class {
  constructor() {
    this.SIMILARITY_THRESHOLD = 0.6;
    this.domainMap = /* @__PURE__ */ new Map([
      ["git", "git" /* GIT */],
      ["doc", "doc" /* DOC */],
      ["jira", "jira" /* JIRA */],
      ["pocket", "pocket" /* POCKET */],
      ["vault", "vault" /* VAULT */],
      ["rules", "rules" /* RULES */]
    ]);
    this.commonCommands = /* @__PURE__ */ new Map([
      ["git" /* GIT */, ["commit-message", "summarize", "explain-diff", "review-pr", "conflict-resolve"]],
      ["doc" /* DOC */, ["add", "search", "list", "delete", "use"]],
      ["jira" /* JIRA */, ["create", "update", "search", "summarize"]],
      ["pocket" /* POCKET */, ["save", "list", "search", "analyze"]],
      ["vault" /* VAULT */, ["save", "search", "link", "summarize"]],
      ["rules" /* RULES */, ["enable", "disable", "create", "list"]]
    ]);
    this.commonSystemCommands = [
      "help",
      "clear",
      "settings",
      "model",
      "debug"
    ];
  }
  /**
   * 명령어 파싱
   * @param input 명령어 입력 문자열
   * @returns 파싱된 명령어 또는 null (명령어가 아닌 경우)
   */
  parse(input) {
    if (!input || !input.trim()) {
      return null;
    }
    const trimmed = input.trim();
    let prefix = "" /* NONE */;
    let content = trimmed;
    let commandType = "none" /* NONE */;
    let domain = "none" /* NONE */;
    if (trimmed.startsWith("@")) {
      if (!trimmed.includes(":")) {
        return null;
      }
      prefix = "@" /* AT */;
      commandType = "at" /* AT */;
      content = trimmed.substring(1);
      domain = this.extractDomain(trimmed);
    } else if (trimmed.startsWith("/")) {
      prefix = "/" /* SLASH */;
      commandType = "slash" /* SLASH */;
      content = trimmed.substring(1);
    } else {
      return null;
    }
    const tokens = this.tokenize(content);
    if (tokens.length === 0) {
      return null;
    }
    const [agentId, commandName, subCommand] = this.extractAgentAndCommand(tokens[0] || "", commandType);
    if (!agentId || !commandName) {
      return null;
    }
    const { args, flags, options } = this.extractArgsAndFlags(tokens.slice(1));
    const command = {
      prefix,
      type: commandType,
      domain,
      agentId,
      command: commandName,
      args,
      flags,
      options,
      rawInput: trimmed
    };
    if (subCommand !== void 0) {
      command.subCommand = subCommand;
    }
    return command;
  }
  /**
   * 입력 문자열이 명령어인지 확인
   * @param input 입력 문자열
   * @returns 명령어 여부
   */
  isCommand(input) {
    if (!input || !input.trim()) {
      return false;
    }
    const trimmed = input.trim();
    if (trimmed.startsWith("/")) {
      return true;
    }
    if (trimmed.startsWith("@") && trimmed.includes(":")) {
      return true;
    }
    return false;
  }
  /**
   * 상세 명령어 파싱 (오타 감지, 추천 등 기능 포함)
   * @param input 입력 문자열
   * @returns 파싱된 명령어 인터페이스
   */
  parseWithSuggestions(input) {
    const command = this.parse(input);
    const result = {
      prefix: "" /* NONE */,
      type: "none" /* NONE */,
      domain: "none" /* NONE */,
      command: "",
      subCommand: "",
      args: [],
      flags: /* @__PURE__ */ new Map(),
      options: /* @__PURE__ */ new Map(),
      raw: input
    };
    if (!command) {
      if (this.looksLikeCommand(input)) {
        result.hasError = true;
        result.errorMessage = "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uBA85\uB839\uC5B4 \uD615\uC2DD\uC785\uB2C8\uB2E4.";
        result.suggestions = this.suggestSimilarCommands(input);
        return result;
      }
      return result;
    }
    const flagsMap = /* @__PURE__ */ new Map();
    Object.entries(command.flags).forEach(([key, value]) => {
      flagsMap.set(key, value);
    });
    const optionsMap = /* @__PURE__ */ new Map();
    Object.entries(command.options).forEach(([key, value]) => {
      optionsMap.set(key, value);
    });
    return {
      prefix: command.prefix,
      type: command.type,
      domain: command.domain,
      command: command.command,
      subCommand: command.subCommand ?? "",
      args: command.args,
      flags: flagsMap,
      options: optionsMap,
      raw: command.rawInput
    };
  }
  /**
   * 명령어와 유사하게 보이는지 확인
   * @param input 입력 문자열
   * @returns 명령어와 유사한지 여부
   */
  looksLikeCommand(input) {
    if (!input || !input.trim()) {
      return false;
    }
    const trimmed = input.trim();
    if (trimmed.startsWith("/") || trimmed.startsWith("@")) {
      return true;
    }
    if (trimmed.includes(":")) {
      return true;
    }
    return false;
  }
  /**
   * 입력 문자열에서 도메인 추출
   * @param input 입력 문자열
   * @returns 도메인 또는 CommandDomain.NONE
   */
  extractDomain(input) {
    if (!input || !input.includes(":")) {
      return "none" /* NONE */;
    }
    const cleanInput = input.startsWith("@") ? input.substring(1) : input;
    const parts = cleanInput.split(":");
    if (!parts || parts.length === 0) {
      return "none" /* NONE */;
    }
    const domainPart = parts[0] ? parts[0].toLowerCase().trim() : "";
    return this.domainMap.get(domainPart) || "none" /* NONE */;
  }
  /**
   * 에이전트/도메인 ID와 명령어 이름 추출
   * @param token 첫 번째 토큰
   * @param commandType 명령어 타입
   * @returns [에이전트 ID, 명령어 이름, 하위 명령어] 또는 잘못된 형식이면 [null, null, null]
   */
  extractAgentAndCommand(token, commandType) {
    if (!token) {
      return [null, null, void 0];
    }
    const parts = token.split(":");
    if (parts && parts.length > 1) {
      const agentId = parts[0] ? parts[0].trim() : "";
      let commandName = parts.length > 1 && parts[1] ? parts[1].trim() : "";
      let subCommand = void 0;
      if (parts.length > 2) {
        const subCommandParts = parts.slice(2).filter((part) => part !== void 0);
        if (subCommandParts.length > 0) {
          subCommand = subCommandParts.join(":").trim();
        }
      }
      if (!agentId || !commandName) {
        return [null, null, void 0];
      }
      return [agentId, commandName, subCommand];
    }
    if (commandType === "slash" /* SLASH */) {
      return ["core", token, void 0];
    }
    return [null, null, void 0];
  }
  /**
   * 입력 문자열 토큰화
   * 따옴표로 묶인 인자 및 공백 처리
   * @param input 입력 문자열
   * @returns 토큰 배열
   */
  tokenize(input) {
    const tokens = [];
    let current = "";
    let inQuote = false;
    let quoteChar = "";
    let escaped = false;
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if ((char === '"' || char === "'") && (!inQuote || quoteChar === char)) {
        if (inQuote) {
          inQuote = false;
          quoteChar = "";
        } else {
          inQuote = true;
          quoteChar = char;
        }
        continue;
      }
      if (char === " " && !inQuote) {
        if (current) {
          tokens.push(current);
          current = "";
        }
        continue;
      }
      current += char;
    }
    if (current) {
      tokens.push(current);
    }
    return tokens;
  }
  /**
   * 인자, 플래그 및 옵션 추출
   * @param tokens 토큰 배열 (첫 번째 토큰 제외)
   * @returns 인자, 플래그 및 옵션 객체
   */
  extractArgsAndFlags(tokens) {
    const args = [];
    const flags = {};
    const options = {};
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token)
        continue;
      if (token.startsWith("--")) {
        const flagParts = token.substring(2).split("=");
        if (flagParts && flagParts.length > 0) {
          const key = flagParts[0] || "";
          if (key) {
            if (flagParts.length > 1) {
              const valueStr = flagParts.slice(1).join("=");
              if (valueStr !== void 0) {
                flags[key] = this.parseValue(valueStr);
              }
            } else {
              flags[key] = true;
            }
          }
        }
      } else if (token.startsWith("-") && token.length === 2) {
        const flagName = token.substring(1);
        if (flagName) {
          const hasNextToken = i + 1 < tokens.length;
          const nextToken = hasNextToken ? tokens[i + 1] || "" : "";
          const validNextToken = nextToken && nextToken.startsWith && !nextToken.startsWith("-");
          if (hasNextToken && validNextToken) {
            flags[flagName] = this.parseValue(nextToken);
            i++;
          } else {
            flags[flagName] = true;
          }
        }
      } else if (token.includes("=") && !token.startsWith("-")) {
        const optionParts = token.split("=");
        if (optionParts && optionParts.length > 0) {
          const key = optionParts[0] ? optionParts[0].trim() : "";
          if (key && optionParts.length > 1) {
            const valueStr = optionParts.slice(1).join("=");
            if (valueStr !== void 0) {
              options[key] = this.parseValue(valueStr);
            }
          }
        }
      } else {
        args.push(this.parseValue(token));
      }
    }
    return { args, flags, options };
  }
  /**
   * 값 파싱 (문자열, 숫자, 불리언 등)
   * @param value 문자열 값
   * @returns 파싱된 값
   */
  parseValue(value) {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }
    if (value.startsWith("{") && value.endsWith("}") || value.startsWith("[") && value.endsWith("]")) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
  /**
   * 유사한 명령어 제안
   * @param command 입력된 오류 명령어
   * @returns 유사한 명령어 목록
   */
  suggestSimilarCommands(command) {
    if (!command || !command.trim()) {
      return [];
    }
    const trimmedCommand = command.trim();
    const suggestions = [];
    if (trimmedCommand.startsWith("@")) {
      const parts = trimmedCommand.substring(1).split(":");
      if (parts && parts.length > 0) {
        const domainPart = parts[0] ? parts[0].toLowerCase().trim() : "";
        const commandPart = parts.length > 1 && parts[1] ? parts[1].toLowerCase().trim() : "";
        const domain = this.getSimilarDomain(domainPart);
        if (domain !== "none" /* NONE */) {
          const commonDomainCommands = this.commonCommands.get(domain) || [];
          if (commandPart) {
            const similarCommands = this.findSimilarCommands(commandPart, commonDomainCommands);
            for (const cmd of similarCommands) {
              suggestions.push(`@${this.getDomainString(domain)}:${cmd}`);
            }
          } else {
            for (const cmd of commonDomainCommands) {
              suggestions.push(`@${this.getDomainString(domain)}:${cmd}`);
            }
          }
        } else {
          this.commonCommands.forEach((cmds, domain2) => {
            if (suggestions.length < 3 && cmds.length > 0) {
              const domainStr = this.getDomainString(domain2);
              if (domainStr) {
                suggestions.push(`@${domainStr}:${cmds[0]}`);
              }
            }
          });
        }
      }
    } else if (trimmedCommand.startsWith("/")) {
      const commandPart = trimmedCommand.substring(1).toLowerCase().trim();
      if (commandPart) {
        const similarCommands = this.findSimilarCommands(commandPart, this.commonSystemCommands);
        for (const cmd of similarCommands) {
          suggestions.push(`/${cmd}`);
        }
      } else {
        for (const cmd of this.commonSystemCommands) {
          suggestions.push(`/${cmd}`);
        }
      }
    }
    return suggestions;
  }
  /**
   * 유사한 도메인 찾기
   * @param input 입력 도메인
   * @returns 유사한 도메인 또는 NONE
   */
  getSimilarDomain(input) {
    if (!input) {
      return "none" /* NONE */;
    }
    if (this.domainMap.has(input)) {
      const domain = this.domainMap.get(input);
      return domain !== void 0 ? domain : "none" /* NONE */;
    }
    let bestMatch = ["", 0];
    this.domainMap.forEach((domain, domainStr) => {
      const similarity = this.calculateSimilarity(input, domainStr);
      if (similarity > this.SIMILARITY_THRESHOLD && similarity > bestMatch[1]) {
        bestMatch = [domainStr, similarity];
      }
    });
    if (bestMatch[0]) {
      const domain = this.domainMap.get(bestMatch[0]);
      return domain !== void 0 ? domain : "none" /* NONE */;
    }
    return "none" /* NONE */;
  }
  /**
   * 도메인 열거형을 문자열로 변환
   * @param domain 도메인 열거형
   * @returns 도메인 문자열
   */
  getDomainString(domain) {
    switch (domain) {
      case "git" /* GIT */:
        return "git";
      case "doc" /* DOC */:
        return "doc";
      case "jira" /* JIRA */:
        return "jira";
      case "pocket" /* POCKET */:
        return "pocket";
      case "vault" /* VAULT */:
        return "vault";
      case "rules" /* RULES */:
        return "rules";
      default:
        return "";
    }
  }
  /**
   * 유사한 명령어 찾기
   * @param input 입력 명령어
   * @param commands 명령어 목록
   * @returns 유사한 명령어 목록
   */
  findSimilarCommands(input, commands4) {
    const result = [];
    for (const cmd of commands4) {
      const similarity = this.calculateSimilarity(input, cmd);
      if (similarity > this.SIMILARITY_THRESHOLD) {
        result.push([cmd, similarity]);
      }
    }
    result.sort((a, b) => b[1] - a[1]);
    return result.slice(0, 3).map(([cmd, _]) => cmd);
  }
  /**
   * 두 문자열 간의 유사도 계산 (Levenshtein 거리 기반)
   * @param str1 첫 번째 문자열
   * @param str2 두 번째 문자열
   * @returns 유사도 (0-1 사이)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) {
      return 1;
    }
    if (longer === shorter) {
      return 1;
    }
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  /**
   * 레벤슈타인 거리 계산
   * @param str1 첫 번째 문자열
   * @param str2 두 번째 문자열
   * @returns 레벤슈타인 거리
   */
  levenshteinDistance(str1, str2) {
    if (!str1)
      return str2 ? str2.length : 0;
    if (!str2)
      return str1.length;
    const len1 = str1.length;
    const len2 = str2.length;
    if (len1 === 0)
      return len2;
    if (len2 === 0)
      return len1;
    let previous = Array(len2 + 1).fill(0);
    let current = Array(len2 + 1).fill(0);
    for (let j = 0; j <= len2; j++) {
      previous[j] = j;
    }
    for (let i = 1; i <= len1; i++) {
      current[0] = i;
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        current[j] = Math.min(
          previous[j] + 1,
          current[j - 1] + 1,
          previous[j - 1] + cost
        );
      }
      [previous, current] = [current, previous];
    }
    return previous[len2];
  }
  /**
   * 명령어 ID를 기반으로 명령어 문자열을 생성합니다.
   * @param commandId 명령어 ID
   * @param type 명령어 타입
   * @param domain 명령어 도메인 (에이전트 명령어인 경우만)
   * @returns 명령어 문자열
   */
  formatCommand(commandId, type, domain) {
    if (!commandId) {
      return "";
    }
    let prefix = "";
    switch (type) {
      case "at" /* AT */:
        prefix = "@";
        if (domain && domain !== "none" /* NONE */) {
          return `${prefix}${this.getDomainString(domain)}:${commandId}`;
        }
        return `${prefix}${commandId}`;
      case "slash" /* SLASH */:
        prefix = "/";
        return `${prefix}${commandId}`;
      default:
        return commandId;
    }
  }
  /**
   * 명령어와 인자를 조합하여 전체 명령어 문자열을 생성합니다.
   * @param commandId 명령어 ID
   * @param type 명령어 타입
   * @param domain 명령어 도메인 (에이전트 명령어인 경우만)
   * @param args 인자 배열
   * @param flags 플래그 객체
   * @param options 옵션 객체
   * @returns 전체 명령어 문자열
   */
  formatCommandWithArgs(commandId, type, domain, args = [], flags = {}, options = {}) {
    const command = this.formatCommand(commandId, type, domain);
    const parts = [command];
    args.forEach((arg) => {
      if (arg.includes(" ")) {
        parts.push(`"${arg.replace(/"/g, '\\"')}"`);
      } else {
        parts.push(arg);
      }
    });
    Object.entries(flags).forEach(([key, value]) => {
      if (value === true) {
        parts.push(`--${key}`);
      } else {
        parts.push(`--${key}=${value}`);
      }
    });
    Object.entries(options).forEach(([key, value]) => {
      parts.push(`${key}=${value}`);
    });
    return parts.join(" ");
  }
};

// src/core/command/CommandRegistryService.ts
var import_events = require("events");
var CommandRegistryService = class extends import_events.EventEmitter {
  /**
   * 명령어 레지스트리 생성자
   * @param pluginRegistry 플러그인 레지스트리 (선택적)
   */
  constructor(pluginRegistry) {
    super();
    /**
     * 명령어 핸들러 맵
     * 에이전트 ID => {명령어 이름 => 핸들러}
     */
    this._handlers = /* @__PURE__ */ new Map();
    /**
     * 도메인 기반 명령어 핸들러 맵
     * 도메인 => {명령어 이름 => 핸들러}
     */
    this._domainHandlers = /* @__PURE__ */ new Map();
    /**
     * 명령어 사용법 맵
     * 에이전트 ID => {명령어 이름 => 사용법}
     */
    this._usages = /* @__PURE__ */ new Map();
    /**
     * 도메인 기반 명령어 사용법 맵
     * 도메인 => {명령어 이름 => 사용법}
     */
    this._domainUsages = /* @__PURE__ */ new Map();
    /**
     * 레거시 명령어 맵
     */
    this._commands = /* @__PURE__ */ new Map();
    /**
     * 컨텍스트 캐시
     * 명령어 추천 및 생성에 사용되는 컨텍스트 정보
     */
    this._contextCache = {};
    /**
     * 플러그인 레지스트리
     */
    this._pluginRegistry = null;
    this._pluginRegistry = pluginRegistry ?? null;
    if (this._pluginRegistry && typeof this._pluginRegistry.on === "function") {
      this._pluginRegistry.on("plugin-registered", () => this.refreshCommands());
      this._pluginRegistry.on("plugin-unregistered", () => this.refreshCommands());
      this._pluginRegistry.on("plugins-initialized", () => this.refreshCommands());
    } else {
      console.warn("\uD50C\uB7EC\uADF8\uC778 \uB808\uC9C0\uC2A4\uD2B8\uB9AC\uC758 \uC774\uBCA4\uD2B8 \uB9AC\uC2A4\uB108 \uB4F1\uB85D \uAE30\uB2A5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      setTimeout(() => this.refreshCommands(), 1e3);
    }
    this.registerCoreCommands();
  }
  /**
   * 초기화 - 플러그인 레지스트리 초기화 및 명령어 새로고침
   */
  async initialize() {
    if (this._pluginRegistry) {
      await this._pluginRegistry.initialize();
    }
    this.refreshCommands();
    this.emit("initialized");
  }
  /**
   * 기본 내장 명령어 등록
   */
  registerCoreCommands() {
    this.register("core", "help", async (args, flags) => {
      const commands4 = this.getAllCommandUsages();
      const atCommands = commands4.filter((cmd) => cmd.syntax.startsWith("@"));
      let helpText = "\uC0AC\uC6A9 \uAC00\uB2A5\uD55C @ \uBA85\uB839\uC5B4:\n\n";
      const pluginGroups = /* @__PURE__ */ new Map();
      atCommands.forEach((cmd) => {
        const groupName = cmd.agentId;
        if (!pluginGroups.has(groupName)) {
          pluginGroups.set(groupName, []);
        }
        const cmdGroup = pluginGroups.get(groupName);
        if (cmdGroup) {
          cmdGroup.push(cmd);
        }
      });
      pluginGroups.forEach((cmds, plugin) => {
        helpText += `[${plugin}]
`;
        cmds.forEach((cmd) => {
          helpText += `  ${cmd.syntax} - ${cmd.description}
`;
        });
        helpText += "\n";
      });
      return {
        success: true,
        message: helpText,
        displayMode: "text"
      };
    });
    this.register("core", "/help", async (args, flags) => {
      const commands4 = this.getAllCommandUsages();
      const slashCommands = commands4.filter((cmd) => cmd.syntax.startsWith("/"));
      let helpText = "# \uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uBA85\uB839\uC5B4\n\n";
      helpText += "## / \uBA85\uB839\uC5B4 (\uB0B4\uBD80 \uAE30\uB2A5)\n\n";
      slashCommands.forEach((cmd) => {
        helpText += `- \`${cmd.syntax}\` - ${cmd.description}
`;
      });
      helpText += "\n### \uAE30\uBCF8 \uBA85\uB839\uC5B4\n\n";
      helpText += "- `/clear` - \uB300\uD654 \uAE30\uB85D \uC9C0\uC6B0\uAE30\n";
      helpText += "- `/model <\uBAA8\uB378ID>` - \uC0AC\uC6A9\uD560 \uBAA8\uB378 \uBCC0\uACBD\n";
      helpText += "- `/debug` - \uB514\uBC84\uADF8 \uC815\uBCF4 \uD45C\uC2DC\n";
      helpText += "\n## @ \uBA85\uB839\uC5B4 (\uC678\uBD80 \uC2DC\uC2A4\uD15C \uC5F0\uB3D9)\n\n";
      helpText += "@ \uBA85\uB839\uC5B4 \uBAA9\uB85D\uC744 \uBCF4\uB824\uBA74 `/help:at` \uBA85\uB839\uC5B4\uB97C \uC0AC\uC6A9\uD558\uC138\uC694.\n";
      return {
        success: true,
        message: helpText,
        displayMode: "markdown"
      };
    });
    this.register("core", "/help:at", async (args, flags) => {
      const commands4 = this.getAllCommandUsages();
      const atCommands = commands4.filter((cmd) => cmd.syntax.startsWith("@"));
      let helpText = "# @ \uBA85\uB839\uC5B4 \uBAA9\uB85D\n\n";
      const pluginGroups = /* @__PURE__ */ new Map();
      atCommands.forEach((cmd) => {
        const groupName = cmd.agentId;
        if (!pluginGroups.has(groupName)) {
          pluginGroups.set(groupName, []);
        }
        pluginGroups.get(groupName).push(cmd);
      });
      if (pluginGroups.size === 0) {
        helpText += "\uB4F1\uB85D\uB41C @ \uBA85\uB839\uC5B4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.\n\n";
        helpText += "\uAC01 \uD50C\uB7EC\uADF8\uC778\uC740 \uC790\uCCB4 \uBA85\uB839\uC5B4\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4. \uC124\uC815\uC5D0 \uD50C\uB7EC\uADF8\uC778\uC744 \uCD94\uAC00\uD558\uBA74 \uB354 \uB9CE\uC740 \uBA85\uB839\uC5B4\uB97C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      } else {
        pluginGroups.forEach((cmds, plugin) => {
          helpText += `## ${plugin} \uD50C\uB7EC\uADF8\uC778

`;
          cmds.forEach((cmd) => {
            helpText += `- \`${cmd.syntax}\` - ${cmd.description}
`;
          });
          helpText += "\n";
        });
      }
      return {
        success: true,
        message: helpText,
        displayMode: "markdown"
      };
    });
    this.register("core", "/model", async (args, flags) => {
      try {
        if (args.length < 1) {
          return {
            success: false,
            message: "\uC0AC\uC6A9\uBC95: /model <\uBAA8\uB378ID> - \uC608: /model gpt-3.5-turbo",
            displayMode: "text"
          };
        }
        const modelId = args[0].toString();
        const vscode10 = require("vscode");
        const config = vscode10.workspace.getConfiguration("ape.llm");
        await config.update("defaultModel", modelId, vscode10.ConfigurationTarget.Global);
        return {
          success: true,
          message: `\uBAA8\uB378\uC774 '${modelId}'(\uC73C)\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
          displayMode: "text"
        };
      } catch (error) {
        console.error("\uBAA8\uB378 \uBCC0\uACBD \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958",
          message: `\uBAA8\uB378 \uBCC0\uACBD \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`,
          displayMode: "text"
        };
      }
    });
    this.register("core", "models", async (args, flags) => {
      try {
        const models = [
          { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
          { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
          { id: "claude-2", name: "Claude 2", provider: "Anthropic" },
          { id: "claude-instant", name: "Claude Instant", provider: "Anthropic" }
        ];
        let response = "# \uC0AC\uC6A9 \uAC00\uB2A5\uD55C LLM \uBAA8\uB378\n\n";
        for (const model of models) {
          response += `## ${model.name} (${model.provider})
`;
          response += `- ID: \`${model.id}\`

`;
        }
        response += "\uBAA8\uB378\uC744 \uBCC0\uACBD\uD558\uB824\uBA74 `/model <\uBAA8\uB378ID>` \uBA85\uB839\uC5B4\uB97C \uC0AC\uC6A9\uD558\uC138\uC694.";
        return {
          success: true,
          message: response,
          displayMode: "markdown"
        };
      } catch (error) {
        console.error("\uBAA8\uB378 \uBAA9\uB85D \uC870\uD68C \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
        return {
          success: false,
          message: "\uBAA8\uB378 \uBAA9\uB85D\uC744 \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
          displayMode: "text"
        };
      }
    });
    this.register("core", "/debug", async (args, flags) => {
      try {
        const debugInfo = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          commands: this.getAllCommandUsages().length,
          handlers: Array.from(this._handlers.keys()).map((agent) => ({
            agent,
            commands: Array.from(this._handlers.get(agent)?.keys() || [])
          }))
        };
        return {
          success: true,
          message: `# \uB514\uBC84\uADF8 \uC815\uBCF4

**\uC2DC\uAC04**: ${(/* @__PURE__ */ new Date()).toLocaleString()}

**\uB4F1\uB85D\uB41C \uBA85\uB839\uC5B4**: ${debugInfo.commands}\uAC1C

**\uD578\uB4E4\uB7EC**:
\`\`\`json
` + JSON.stringify(debugInfo.handlers, null, 2) + "\n```\n\n\uC2DC\uC2A4\uD15C\uC774 \uC815\uC0C1\uC801\uC73C\uB85C \uC791\uB3D9 \uC911\uC785\uB2C8\uB2E4.",
          displayMode: "markdown",
          data: debugInfo
        };
      } catch (error) {
        console.error("\uB514\uBC84\uADF8 \uC815\uBCF4 \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
        return {
          success: false,
          message: "\uB514\uBC84\uADF8 \uC815\uBCF4\uB97C \uC0DD\uC131\uD558\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
          error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958",
          displayMode: "text"
        };
      }
    });
  }
  /**
   * 명령어 핸들러 등록
   * @param agentId 에이전트 ID
   * @param command 명령어 이름
   * @param handler 명령어 핸들러
   * @returns 등록 성공 여부
   */
  register(agentId, command, handler) {
    try {
      if (!agentId || !command || !handler) {
        console.error("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uBA85\uB839\uC5B4 \uB4F1\uB85D \uC815\uBCF4:", { agentId, command });
        return false;
      }
      if (!this._handlers.has(agentId)) {
        this._handlers.set(agentId, /* @__PURE__ */ new Map());
      }
      const agentCommands = this._handlers.get(agentId);
      if (agentCommands.has(command)) {
        console.warn(`\uC774\uBBF8 \uB4F1\uB85D\uB41C \uBA85\uB839\uC5B4: ${agentId}:${command}`);
        return false;
      }
      agentCommands.set(command, handler);
      this.emit("command-registered", { agentId, command });
      this.emit("commands-changed");
      return true;
    } catch (error) {
      console.error(`\uBA85\uB839\uC5B4 \uB4F1\uB85D \uC624\uB958 (${agentId}:${command}):`, error);
      return false;
    }
  }
  /**
   * 명령어 핸들러 조회
   * @param agentId 에이전트 ID
   * @param command 명령어 이름
   * @returns 명령어 핸들러 또는 undefined
   */
  getHandler(agentId, command) {
    const agentCommands = this._handlers.get(agentId);
    if (!agentCommands) {
      return void 0;
    }
    return agentCommands.get(command);
  }
  /**
   * 모든 명령어 핸들러 조회
   * @returns 명령어 핸들러 맵
   */
  getAllHandlers() {
    return this._handlers;
  }
  /**
   * 명령어 맵 가져오기 (UI 호환성 메서드)
   * @returns 명령어 맵
   */
  getCommandMap() {
    return this._commands;
  }
  /**
   * 모든 도메인 명령어 핸들러 조회
   * @returns 도메인별 명령어 핸들러 맵
   */
  getAllDomainHandlers() {
    return this._domainHandlers;
  }
  /**
   * 명령어 사용법 등록
   * @param usage 명령어 사용법
   * @returns 등록 성공 여부
   */
  registerUsage(usage) {
    try {
      if (!usage.agentId || !usage.command) {
        console.error("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uBA85\uB839\uC5B4 \uC0AC\uC6A9\uBC95:", usage);
        return false;
      }
      if (!this._usages.has(usage.agentId)) {
        this._usages.set(usage.agentId, /* @__PURE__ */ new Map());
      }
      const agentUsages = this._usages.get(usage.agentId);
      agentUsages.set(usage.command, usage);
      return true;
    } catch (error) {
      console.error(`\uBA85\uB839\uC5B4 \uC0AC\uC6A9\uBC95 \uB4F1\uB85D \uC624\uB958 (${usage.agentId}:${usage.command}):`, error);
      return false;
    }
  }
  /**
   * 명령어 사용법 조회
   * @param agentId 에이전트 ID
   * @param command 명령어 이름
   * @returns 명령어 사용법 또는 undefined
   */
  getUsage(agentId, command) {
    const agentUsages = this._usages.get(agentId);
    if (!agentUsages) {
      return void 0;
    }
    return agentUsages.get(command);
  }
  /**
   * 에이전트의 모든 명령어 사용법 조회
   * @param agentId 에이전트 ID
   * @returns 명령어 사용법 목록
   */
  getAgentCommands(agentId) {
    const agentUsages = this._usages.get(agentId);
    if (!agentUsages) {
      return [];
    }
    return Array.from(agentUsages.values());
  }
  /**
   * 모든 명령어 사용법 조회 (에이전트 기반 및 도메인 기반 모두 포함)
   * @returns 명령어 사용법 목록
   */
  getAllCommandUsages() {
    const allUsages = [];
    this._usages.forEach((agentUsages) => {
      const usageValues = Array.from(agentUsages.values());
      allUsages.push(...usageValues);
    });
    this._domainUsages.forEach((domainUsages) => {
      const usageValues = Array.from(domainUsages.values());
      allUsages.push(...usageValues);
    });
    return allUsages;
  }
  /**
   * 모든 시스템 명령어 사용법 조회 (/로 시작하는 명령어)
   * @returns 시스템 명령어 사용법 목록
   */
  getAllSystemCommandUsages() {
    const allUsages = this.getAllCommandUsages();
    return allUsages.filter(
      (usage) => usage.syntax.startsWith("/") || usage.command && usage.command.startsWith("/")
    );
  }
  /**
   * 모든 에이전트 명령어 사용법 조회 (@로 시작하는 명령어)
   * @returns 에이전트 명령어 사용법 목록
   */
  getAllAgentCommandUsages() {
    const allUsages = this.getAllCommandUsages();
    return allUsages.filter(
      (usage) => usage.syntax.startsWith("@") || usage.command && usage.command.startsWith("@")
    );
  }
  /**
   * 도메인 또는 에이전트 기반으로 모든 명령어 가져오기
   * @param grouped 그룹화 여부 (default: true - 도메인/에이전트별 그룹화)
   * @returns 그룹화된 명령어 맵 또는 전체 목록
   */
  getAllCommands(grouped = true) {
    if (!grouped) {
      return this.getAllCommandUsages();
    }
    const groupedCommands = /* @__PURE__ */ new Map();
    this._usages.forEach((usages, agentId) => {
      const usagesList = Array.from(usages.values());
      if (usagesList.length > 0) {
        groupedCommands.set(agentId, usagesList);
      }
    });
    this._domainUsages.forEach((usages, domain) => {
      const domainKey = `domain:${domain}`;
      const usagesList = Array.from(usages.values());
      if (usagesList.length > 0) {
        groupedCommands.set(domainKey, usagesList);
      }
    });
    return groupedCommands;
  }
  /**
   * 명령어 실행
   * @param fullCommand 전체 명령어 (agentId:command 또는 domain:command 형식)
   * @param args 명령어 인자
   * @param flags 명령어 플래그
   * @returns 명령어 실행 결과
   */
  async executeCommand(fullCommand, args = [], flags = {}) {
    const parts = fullCommand.split(":");
    let agentId = "core";
    let command;
    let domain = "none" /* NONE */;
    if (parts.length === 1) {
      command = parts[0] || "";
    } else {
      const firstPart = parts[0] || "";
      const domainValue = firstPart && firstPart.startsWith("@") ? firstPart.substring(1) : firstPart;
      try {
        if (domainValue) {
          domain = Object.values(CommandDomain).find(
            (d) => d && d.toString().toLowerCase() === domainValue.toLowerCase()
          ) || "none" /* NONE */;
        }
      } catch (e) {
        domain = "none" /* NONE */;
      }
      if (domain !== "none" /* NONE */) {
        command = parts.slice(1).join(":") || "";
      } else {
        agentId = firstPart;
        command = parts.slice(1).join(":") || "";
      }
    }
    let handler;
    if (domain !== "none" /* NONE */) {
      handler = this.getDomainHandler(domain, command);
    } else {
      handler = this.getHandler(agentId, command);
    }
    if (!handler) {
      let suggestions = [];
      const commandsList = domain !== "none" /* NONE */ ? this.getDomainCommands(domain).map((u) => u.command) : this.getAgentCommands(agentId).map((u) => u.command);
      const MAX_LEVENSHTEIN_DISTANCE = 3;
      for (const cmd of commandsList) {
        const distance = this.calculateLevenshteinDistance(command, cmd);
        if (distance <= MAX_LEVENSHTEIN_DISTANCE) {
          suggestions.push(cmd);
        }
      }
      if (suggestions.length === 0) {
        if (domain !== "none" /* NONE */) {
          suggestions = this.getDomainCommands(domain).slice(0, 3).map((u) => `@${domain}:${u.command}`);
        } else {
          suggestions = ["/help", "@help"];
        }
      } else {
        if (domain !== "none" /* NONE */) {
          suggestions = suggestions.map((s) => `@${domain}:${s}`);
        } else if (agentId) {
          const prefix = command.startsWith("/") ? "/" : "@";
          suggestions = suggestions.map((s) => `${agentId}:${s}`);
        }
      }
      return {
        success: false,
        error: `\uBA85\uB839\uC5B4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${domain !== "none" /* NONE */ ? `@${domain}:${command}` : `${agentId}:${command}`}`,
        displayMode: "text",
        suggestedNextCommands: suggestions
      };
    }
    try {
      const result = await handler(args, flags);
      if (typeof result === "string") {
        const stringResult = result;
        return {
          success: true,
          message: stringResult,
          displayMode: stringResult.includes("#") || stringResult.includes("**") ? "markdown" : "text"
        };
      } else if (result && typeof result === "object") {
        if ("success" in result) {
          return result;
        } else if ("content" in result) {
          const contentResult = result;
          return {
            success: true,
            message: contentResult.content,
            data: result,
            displayMode: "markdown"
          };
        } else {
          return {
            success: true,
            data: result,
            displayMode: "json"
          };
        }
      } else {
        return {
          success: true,
          data: result,
          displayMode: "text"
        };
      }
    } catch (error) {
      console.error(`\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC624\uB958 (${domain !== "none" /* NONE */ ? `@${domain}:${command}` : `${agentId}:${command}`}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: "text"
      };
    }
  }
  /**
   * 레벤슈타인 거리 계산 (문자열 유사도)
   * @param a 첫 번째 문자열
   * @param b 두 번째 문자열
   * @returns 레벤슈타인 거리
   */
  calculateLevenshteinDistance(a, b) {
    if (!a)
      return b ? b.length : 0;
    if (!b)
      return a.length;
    if (a.length === 0)
      return b.length;
    if (b.length === 0)
      return a.length;
    let prev = Array(b.length + 1).fill(0);
    let curr = Array(b.length + 1).fill(0);
    for (let j = 0; j <= b.length; j++) {
      prev[j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + cost
        );
      }
      [prev, curr] = [curr, prev];
    }
    return prev[b.length];
  }
  /**
   * 에이전트 명령어 등록 - 도메인 기반 명령어 지원 추가
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @param handler 명령어 핸들러
   * @param usage 명령어 사용법 정보 (선택적)
   * @returns 등록 성공 여부
   */
  registerAgentCommand(domain, command, handler, usage) {
    try {
      if (!domain || !command || !handler) {
        console.error("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC5D0\uC774\uC804\uD2B8 \uBA85\uB839\uC5B4 \uB4F1\uB85D \uC815\uBCF4:", { domain, command });
        return false;
      }
      if (!this._domainHandlers.has(domain)) {
        this._domainHandlers.set(domain, /* @__PURE__ */ new Map());
      }
      const domainCommands = this._domainHandlers.get(domain);
      if (domainCommands.has(command)) {
        console.warn(`\uC774\uBBF8 \uB4F1\uB85D\uB41C \uB3C4\uBA54\uC778 \uBA85\uB839\uC5B4: ${domain}:${command}`);
        return false;
      }
      domainCommands.set(command, handler);
      if (usage) {
        this.registerDomainUsage({
          domain,
          command,
          description: usage.description || "",
          syntax: usage.syntax || `@${domain}:${command}`,
          examples: usage.examples || [],
          flags: usage.flags || []
        });
      }
      this.emit("agent-command-registered", { domain, command });
      this.emit("commands-changed");
      return true;
    } catch (error) {
      console.error(`\uC5D0\uC774\uC804\uD2B8 \uBA85\uB839\uC5B4 \uB4F1\uB85D \uC624\uB958 (${domain}:${command}):`, error);
      return false;
    }
  }
  /**
   * 시스템 명령어 등록 - 내부 시스템 기능을 위한 명령어
   * @param command 명령어 이름 (슬래시 포함)
   * @param handler 명령어 핸들러
   * @param usage 명령어 사용법 정보 (선택적)
   * @returns 등록 성공 여부
   */
  registerSystemCommand(command, handler, usage) {
    const fullCommand = command.startsWith("/") ? command : `/${command}`;
    const registrationResult = this.register("core", fullCommand, handler);
    if (registrationResult && usage) {
      this.registerUsage({
        agentId: "core",
        command: fullCommand,
        description: usage.description || "",
        syntax: usage.syntax || fullCommand,
        examples: usage.examples || [],
        flags: usage.flags || []
      });
    }
    return registrationResult;
  }
  /**
   * 도메인 기반 명령어 사용법 등록
   * @param usage 도메인 명령어 사용법
   * @returns 등록 성공 여부
   */
  registerDomainUsage(usage) {
    try {
      if (!usage.domain || !usage.command) {
        console.error("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB3C4\uBA54\uC778 \uBA85\uB839\uC5B4 \uC0AC\uC6A9\uBC95:", usage);
        return false;
      }
      if (!this._domainUsages.has(usage.domain)) {
        this._domainUsages.set(usage.domain, /* @__PURE__ */ new Map());
      }
      const domainUsages = this._domainUsages.get(usage.domain);
      domainUsages.set(usage.command, {
        agentId: usage.domain.toString(),
        command: usage.command,
        description: usage.description,
        syntax: usage.syntax,
        examples: usage.examples || [],
        flags: usage.flags || []
      });
      return true;
    } catch (error) {
      console.error(`\uB3C4\uBA54\uC778 \uBA85\uB839\uC5B4 \uC0AC\uC6A9\uBC95 \uB4F1\uB85D \uC624\uB958 (${usage.domain}:${usage.command}):`, error);
      return false;
    }
  }
  /**
   * 도메인 기반 명령어 핸들러 조회
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @returns 명령어 핸들러 또는 undefined
   */
  getDomainHandler(domain, command) {
    const domainCommands = this._domainHandlers.get(domain);
    if (!domainCommands) {
      return void 0;
    }
    return domainCommands.get(command);
  }
  /**
   * 도메인 기반 명령어 사용법 조회
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @returns 명령어 사용법 또는 undefined
   */
  getDomainUsage(domain, command) {
    const domainUsages = this._domainUsages.get(domain);
    if (!domainUsages) {
      return void 0;
    }
    return domainUsages.get(command);
  }
  /**
   * 도메인의 모든 명령어 사용법 조회
   * @param domain 명령어 도메인
   * @returns 명령어 사용법 목록
   */
  getDomainCommands(domain) {
    const domainUsages = this._domainUsages.get(domain);
    if (!domainUsages) {
      return [];
    }
    return Array.from(domainUsages.values());
  }
  /**
   * 컨텍스트 기반 명령어 생성
   * 현재 컨텍스트에 따라 명령어를 자동 생성하거나 추천
   * @param commandPattern 기본 명령어 또는 명령어 패턴
   * @param additionalContext 추가 컨텍스트 객체 (선택적)
   * @returns 컨텍스트 인식 명령어 또는 명령어 배열
   */
  async generateContextualCommand(commandPattern, additionalContext) {
    if (additionalContext) {
      this._contextCache = { ...this._contextCache, ...additionalContext };
    }
    const context = { ...this._contextCache };
    let domain = "none" /* NONE */;
    if (commandPattern && commandPattern.startsWith("@")) {
      const parts = commandPattern.substring(1).split(":");
      const domainPart = parts.length > 0 ? parts[0] : "";
      if (domainPart) {
        switch (domainPart.toLowerCase()) {
          case "git":
            domain = "git" /* GIT */;
            break;
          case "jira":
            domain = "jira" /* JIRA */;
            break;
          case "pocket":
            domain = "pocket" /* POCKET */;
            break;
          case "doc":
            domain = "doc" /* DOC */;
            break;
          case "vault":
            domain = "vault" /* VAULT */;
            break;
          case "rules":
            domain = "rules" /* RULES */;
            break;
          default:
            domain = "none" /* NONE */;
        }
      }
    }
    switch (domain) {
      case "git" /* GIT */:
        return this._generateGitContextualCommand(commandPattern, context);
      case "jira" /* JIRA */:
        return this._generateJiraContextualCommand(commandPattern, context);
      case "pocket" /* POCKET */:
        return this._generatePocketContextualCommand(commandPattern, context);
      case "doc" /* DOC */:
        return this._generateDocContextualCommand(commandPattern, context);
      default:
        return commandPattern;
    }
  }
  /**
   * Git 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Git 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  _generateGitContextualCommand(baseCommand, context) {
    const parts = baseCommand.split(":");
    if (parts.length < 2)
      return baseCommand;
    const command = parts[1];
    switch (command) {
      case "checkout":
        if ("currentBranch" in context && context["currentBranch"]) {
          return `@git:checkout ${context["currentBranch"]}`;
        }
        if ("branches" in context && Array.isArray(context["branches"])) {
          return context["branches"].slice(0, 5).map((branch) => `@git:checkout ${branch}`);
        }
        break;
      case "commit":
        if ("changedFiles" in context && Array.isArray(context["changedFiles"]) && context["changedFiles"].length > 0) {
          const firstFile = context["changedFiles"][0];
          return `@git:commit -m "Update ${firstFile}"`;
        }
        if ("activeFile" in context && context["activeFile"]) {
          const fileName = context["activeFile"].split("/").pop();
          return `@git:commit -m "Update ${fileName || "file"}"`;
        }
        break;
      case "push":
        if ("currentBranch" in context && context["currentBranch"]) {
          return `@git:push origin ${context["currentBranch"]}`;
        }
        break;
      case "pull":
        if ("currentBranch" in context && context["currentBranch"]) {
          return `@git:pull origin ${context["currentBranch"]}`;
        }
        break;
    }
    return baseCommand;
  }
  /**
   * Jira 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Jira 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  _generateJiraContextualCommand(baseCommand, context) {
    const parts = baseCommand.split(":");
    if (parts.length < 2)
      return baseCommand;
    const command = parts[1];
    switch (command) {
      case "view":
      case "issue":
        if ("issueKey" in context && context["issueKey"]) {
          return `@jira:view ${context["issueKey"]}`;
        }
        if ("recentIssues" in context && Array.isArray(context["recentIssues"])) {
          return context["recentIssues"].slice(0, 3).map(
            (issue) => `@jira:view ${typeof issue === "string" ? issue : issue && typeof issue === "object" && "key" in issue ? issue.key : "unknown"}`
          );
        }
        break;
      case "create":
        if ("activeFile" in context && context["activeFile"]) {
          const fileName = context["activeFile"].split("/").pop();
          return `@jira:create --title "Issue with ${fileName || "file"}"`;
        }
        break;
    }
    return baseCommand;
  }
  /**
   * Pocket 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Pocket 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  _generatePocketContextualCommand(baseCommand, context) {
    const parts = baseCommand.split(":");
    if (parts.length < 2)
      return baseCommand;
    const command = parts[1];
    switch (command) {
      case "read":
        if ("articleId" in context && context["articleId"]) {
          return `@pocket:read ${context["articleId"]}`;
        }
        if ("recentArticles" in context && Array.isArray(context["recentArticles"])) {
          return context["recentArticles"].slice(0, 3).map(
            (article) => `@pocket:read ${typeof article === "string" ? article : article && typeof article === "object" && "id" in article ? article.id : "unknown"}`
          );
        }
        break;
      case "search":
        if ("searchQuery" in context && context["searchQuery"]) {
          return `@pocket:search ${context["searchQuery"]}`;
        }
        break;
    }
    return baseCommand;
  }
  /**
   * Doc 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Doc 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  _generateDocContextualCommand(baseCommand, context) {
    const parts = baseCommand.split(":");
    if (parts.length < 2)
      return baseCommand;
    const command = parts[1];
    switch (command) {
      case "search":
        if ("searchQuery" in context && context["searchQuery"]) {
          return `@doc:search ${context["searchQuery"]}`;
        }
        break;
    }
    return baseCommand;
  }
  /**
   * 명령어 추천 제안 목록 생성
   * @param context 컨텍스트 정보
   * @param limit 최대 추천 수 (기본값: 5)
   * @returns 추천 명령어 목록
   */
  async suggestCommands(context, limit = 5) {
    this._contextCache = { ...this._contextCache, ...context };
    const suggestions = [];
    if ("activeFile" in context && context["activeFile"]) {
      const activeFile = context["activeFile"];
      const parts = activeFile ? activeFile.split(".") : [];
      const fileExtension = parts && parts.length > 1 ? parts[parts.length - 1]?.toLowerCase() || "" : "";
      switch (fileExtension) {
        case "js":
        case "ts":
        case "jsx":
        case "tsx":
          suggestions.push("@git:status");
          suggestions.push("@git:diff");
          suggestions.push("@git:commit");
          break;
        case "md":
        case "txt":
          suggestions.push("@doc:search");
          suggestions.push("@doc:index");
          break;
      }
    }
    if ("currentBranch" in context && context["currentBranch"]) {
      suggestions.push(`@git:push origin ${context["currentBranch"]}`);
      suggestions.push(`@git:pull origin ${context["currentBranch"]}`);
    }
    if ("recentCommands" in context && Array.isArray(context["recentCommands"])) {
      suggestions.push(...context["recentCommands"].slice(0, 3));
    }
    const uniqueSuggestions = [];
    for (const suggestion of suggestions) {
      if (!uniqueSuggestions.includes(suggestion)) {
        uniqueSuggestions.push(suggestion);
      }
    }
    return uniqueSuggestions.slice(0, limit);
  }
  /**
   * 플러그인에서 모든 명령어를 다시 로드합니다.
   * @returns 로드된 명령어 수
   */
  refreshCommands() {
    if (!this._pluginRegistry) {
      return 0;
    }
    this._handlers.clear();
    this._usages.clear();
    this._domainHandlers.clear();
    this._domainUsages.clear();
    const plugins = this._pluginRegistry.getEnabledPlugins() || [];
    let commandCount = 0;
    for (const plugin of plugins) {
      if (!plugin)
        continue;
      const pluginCommands = plugin.getCommands?.() || [];
      for (const cmd of pluginCommands) {
        if (!cmd || !cmd.name)
          continue;
        const fullCommandName = cmd.name;
        let domain = "none" /* NONE */;
        if (cmd.domain) {
          domain = cmd.domain;
        } else if (plugin.getDomain) {
          const domainStr = plugin.getDomain();
          domain = Object.values(CommandDomain).find(
            (d) => d.toString().toLowerCase() === domainStr.toLowerCase()
          ) || "none" /* NONE */;
        }
        const handler = async (args, flags) => {
          return await plugin.executeCommand(fullCommandName, args);
        };
        let registered = false;
        if (domain !== "none" /* NONE */) {
          registered = this.registerAgentCommand(domain, fullCommandName, handler, {
            description: cmd.description || "",
            syntax: cmd.syntax || `@${domain}:${fullCommandName}`,
            examples: cmd.examples || []
          });
        } else {
          registered = this.register(plugin.id, fullCommandName, handler);
          if (registered) {
            this.registerUsage({
              agentId: plugin.id,
              command: fullCommandName,
              description: cmd.description || "",
              syntax: cmd.syntax || `@${plugin.id}:${fullCommandName}`,
              examples: cmd.examples || []
            });
          }
        }
        if (registered) {
          commandCount++;
        }
      }
    }
    this.emit("commands-changed");
    return commandCount;
  }
  /**
   * 명령어 변경 이벤트 리스너를 등록합니다.
   * @param listener 이벤트 리스너
   * @returns this
   */
  onCommandsChanged(listener) {
    this.on("commands-changed", listener);
    return this;
  }
  /**
   * 현재 컨텍스트 캐시 조회
   * @returns 컨텍스트 캐시 객체
   */
  getContextCache() {
    return this._contextCache;
  }
  /**
   * 플러그인 조회 - PluginRegistryService 프록시 메서드
   * @param pluginId 플러그인 ID
   * @returns 플러그인 인스턴스 또는 undefined
   */
  getPlugin(pluginId) {
    if (!this._pluginRegistry) {
      return void 0;
    }
    return this._pluginRegistry.getPlugin(pluginId);
  }
  /**
   * 명령어 찾기 (ID 또는 이름으로)
   * @param agentId 에이전트/플러그인 ID
   * @param commandName 명령어 이름
   * @returns 명령어 객체 또는 undefined
   */
  findCommand(agentId, commandName) {
    if (!agentId || !commandName) {
      return void 0;
    }
    const handler = this.getHandler(agentId, commandName);
    if (!handler) {
      return void 0;
    }
    const usage = this.getUsage(agentId, commandName);
    const cmdObj = {
      id: `${agentId}:${commandName}`,
      handler,
      agentId,
      command: commandName
    };
    if (usage) {
      Object.entries(usage).forEach(([key, value]) => {
        if (value !== void 0) {
          cmdObj[key] = value;
        }
      });
    }
    return cmdObj;
  }
  /**
   * 명령어를 등록합니다. (레거시 호환성)
   * @param command 명령어 객체
   * @returns 등록 성공 여부
   */
  registerCommand(command) {
    try {
      if (!command || !command.id) {
        console.error("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uBA85\uB839\uC5B4:", command);
        return false;
      }
      const parts = command.id.split(":");
      let agentId = "core";
      let commandName = "";
      if (parts.length === 1) {
        agentId = "core";
        commandName = parts[0] || "";
      } else if (parts.length > 1) {
        agentId = parts[0] || "";
        commandName = parts.slice(1).join(":") || "";
      } else {
        console.error("Invalid command ID format:", command.id);
        return false;
      }
      if (!commandName) {
        console.error("Command name cannot be empty");
        return false;
      }
      this._commands.set(command.id, command);
      return this.register(agentId, commandName, command.handler);
    } catch (error) {
      console.error(`\uBA85\uB839\uC5B4 \uB4F1\uB85D \uC624\uB958 (${command?.id}):`, error);
      return false;
    }
  }
  /**
   * 레거시 UI 호환성 메서드: 명령어 존재 여부 확인
   * @param commandId 명령어 ID
   * @returns 명령어 존재 여부
   */
  hasCommand(commandId) {
    if (!commandId)
      return false;
    const parts = commandId.split(":");
    let agentId = "core";
    let command = "";
    if (parts.length === 1) {
      agentId = "core";
      command = parts[0] || "";
    } else if (parts.length > 1) {
      agentId = parts[0] || "";
      command = parts.slice(1).join(":") || "";
    } else {
      return false;
    }
    return this.getHandler(agentId, command) !== void 0;
  }
  /**
   * 레거시 UI 호환성 메서드: 특정 타입의 명령어 목록 가져오기
   * @param type 명령어 타입
   * @returns 명령어 목록
   */
  getCommandsByType(type) {
    const commands4 = [];
    this._handlers.forEach((handlers, agentId) => {
      handlers.forEach((handler, commandName) => {
        const usage = this.getUsage(agentId, commandName);
        if (usage) {
          let commandType = "none" /* NONE */;
          let prefix = "" /* NONE */;
          if (usage.syntax.startsWith("@")) {
            commandType = "at" /* AT */;
            prefix = "@" /* AT */;
          } else if (usage.syntax.startsWith("/")) {
            commandType = "slash" /* SLASH */;
            prefix = "/" /* SLASH */;
          }
          if (commandType === type) {
            commands4.push({
              id: `${agentId}:${commandName}`,
              type: commandType,
              prefix,
              domain: usage.domain || "none" /* NONE */,
              description: usage.description,
              handler
            });
          }
        }
      });
    });
    return commands4;
  }
};

// src/core/command/CommandExecutorService.ts
var CommandExecutorService = class {
  /**
   * CommandExecutorService 생성자
   * @param commandRegistry 명령어 레지스트리
   * @param pluginRegistry 플러그인 레지스트리
   */
  constructor(commandRegistry, pluginRegistry) {
    this.commandRegistry = commandRegistry;
    this.pluginRegistry = pluginRegistry;
    /**
     * 실행 이력 저장소
     */
    this.executionHistory = [];
    /**
     * 실행 중인 명령어 맵
     */
    this.pendingCommands = /* @__PURE__ */ new Map();
    this.parser = new CommandParserService();
  }
  /**
   * 명령어 실행
   * @param command 실행할 명령어
   * @returns 명령어 실행 결과
   */
  async execute(command) {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      const startTime = Date.now();
      const cancelController = new AbortController();
      const signal = cancelController.signal;
      this.pendingCommands.set(commandId, {
        command,
        cancel: () => cancelController.abort(),
        timestamp: startTime
      });
      let result;
      if (signal.aborted) {
        return {
          success: false,
          error: "\uBA85\uB839\uC5B4 \uC2E4\uD589\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          displayMode: "text"
        };
      }
      try {
        if (command.domain && command.domain !== "none" /* NONE */) {
          result = await this.executeDomainCommand(command, signal);
        } else {
          switch (command.prefix) {
            case "@" /* AT */:
              result = await this.executePluginCommand(command, signal);
              break;
            case "/" /* SLASH */:
              result = await this.executeInternalCommand(command, signal);
              break;
            default:
              return {
                success: false,
                error: `\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uBA85\uB839\uC5B4 \uC811\uB450\uC0AC: ${command.prefix}`,
                displayMode: "text"
              };
          }
        }
      } catch (error) {
        if (signal.aborted) {
          return {
            success: false,
            error: "\uBA85\uB839\uC5B4 \uC2E4\uD589\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
            displayMode: "text"
          };
        }
        throw error;
      }
      const executionTime = Date.now() - startTime;
      const normalizedResult = this.normalizeResult(result);
      this.executionHistory.push({
        command,
        result: normalizedResult,
        timestamp: Date.now(),
        id: commandId
      });
      this.pendingCommands.delete(commandId);
      console.log(`\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC644\uB8CC (${executionTime}ms): ${command.prefix}${command.domain !== "none" /* NONE */ ? command.domain : command.agentId}:${command.command}`);
      return normalizedResult;
    } catch (error) {
      this.pendingCommands.delete(commandId);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: "text"
      };
      this.executionHistory.push({
        command,
        result: errorResult,
        timestamp: Date.now(),
        id: commandId
      });
      console.error(`\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC2E4\uD328 (${command.prefix}${command.domain !== "none" /* NONE */ ? command.domain : command.agentId}:${command.command}):`, error);
      return errorResult;
    }
  }
  /**
   * 결과 정규화 - 여러 형식의 결과를 CommandResult로 변환
   * @param result 원본 결과
   * @returns 정규화된 CommandResult
   */
  normalizeResult(result) {
    if (!result) {
      return {
        success: true,
        message: "\uBA85\uB839\uC774 \uC2E4\uD589\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        displayMode: "text"
      };
    }
    if (typeof result === "object" && "success" in result) {
      return result;
    }
    if (typeof result === "string") {
      return {
        success: true,
        message: result,
        displayMode: result.includes("#") || result.includes("**") ? "markdown" : "text"
      };
    }
    if (typeof result === "object" && "content" in result) {
      const hasError = "error" in result && result.error === true;
      return {
        success: !hasError,
        message: result.content,
        data: result,
        error: hasError ? "\uBA85\uB839 \uC2E4\uD589 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." : "",
        displayMode: "markdown"
      };
    }
    return {
      success: true,
      data: result,
      displayMode: "json"
    };
  }
  /**
   * 플러그인 명령어 실행 (@ 명령어)
   * @param command 실행할 명령어
   * @param signal AbortSignal (명령어 취소용)
   * @returns 실행 결과
   */
  async executePluginCommand(command, signal) {
    if (signal?.aborted) {
      return {
        success: false,
        error: "\uBA85\uB839\uC5B4 \uC2E4\uD589\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        displayMode: "text"
      };
    }
    const plugin = this.pluginRegistry.getPlugin(command.agentId);
    if (!plugin) {
      if (command.agentId === "jira") {
        return {
          success: false,
          message: `# Jira \uD50C\uB7EC\uADF8\uC778\uC774 \uB4F1\uB85D\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4

\uC124\uC815 \uD30C\uC77C\uC5D0 Jira \uC778\uC99D \uC815\uBCF4\uB97C \uCD94\uAC00\uD558\uC138\uC694:
\`\`\`json
"internalPlugins": {
  "jira": {
    "credentials": {
      "token": "\uC2E4\uC81C_\uD1A0\uD070_\uAC12"
    }
  }
}
\`\`\``,
          displayMode: "markdown",
          data: { type: "plugin-not-found" }
        };
      }
      return {
        success: false,
        error: `\uD50C\uB7EC\uADF8\uC778\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${command.agentId}`,
        displayMode: "text"
      };
    }
    if (!plugin.isEnabled()) {
      return {
        success: false,
        error: `\uD50C\uB7EC\uADF8\uC778\uC774 \uBE44\uD65C\uC131\uD654\uB428: ${command.agentId}`,
        displayMode: "text"
      };
    }
    if (command.agentId === "jira" && !plugin.isInitialized()) {
      return {
        success: false,
        message: `# Jira \uD50C\uB7EC\uADF8\uC778 \uC778\uC99D \uC815\uBCF4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4

\uC124\uC815 \uD30C\uC77C\uC5D0 Jira \uC778\uC99D \uC815\uBCF4\uB97C \uCD94\uAC00\uD558\uC138\uC694:
\`\`\`json
"internalPlugins": {
  "jira": {
    "credentials": {
      "token": "\uC2E4\uC81C_\uD1A0\uD070_\uAC12"
    }
  }
}
\`\`\``,
        displayMode: "markdown",
        data: { type: "jira-auth-required" }
      };
    }
    try {
      console.log(`\uD50C\uB7EC\uADF8\uC778 \uBA85\uB839\uC5B4 \uC2E4\uD589: ${command.agentId}:${command.command}`);
      const result = await plugin.executeCommand(command.command, command.args);
      if (signal?.aborted) {
        return {
          success: false,
          error: "\uBA85\uB839\uC5B4 \uC2E4\uD589\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          displayMode: "text"
        };
      }
      return this.normalizeResult(result);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: "text"
      };
    }
  }
  /**
   * 내부 명령어 실행 (/ 명령어)
   * @param command 실행할 명령어
   * @param signal AbortSignal (명령어 취소용)
   * @returns 실행 결과
   */
  async executeInternalCommand(command, signal) {
    if (signal?.aborted) {
      return {
        success: false,
        error: "\uBA85\uB839\uC5B4 \uC2E4\uD589\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        displayMode: "text"
      };
    }
    const handler = this.commandRegistry.getHandler(command.agentId, command.command);
    if (!handler) {
      return {
        success: false,
        error: `\uB0B4\uBD80 \uBA85\uB839\uC5B4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${command.agentId}:${command.command}`,
        displayMode: "text",
        suggestedNextCommands: ["/help"]
      };
    }
    try {
      console.log(`\uB0B4\uBD80 \uBA85\uB839\uC5B4 \uC2E4\uD589: ${command.agentId}:${command.command}`);
      const result = await handler(command.args, command.flags);
      if (signal?.aborted) {
        return {
          success: false,
          error: "\uBA85\uB839\uC5B4 \uC2E4\uD589\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          displayMode: "text"
        };
      }
      return this.normalizeResult(result);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: "text"
      };
    }
  }
  /**
   * 도메인 기반 명령어 실행 (@ 명령어 중 도메인으로 구분된 명령어)
   * @param command 실행할 명령어
   * @param signal AbortSignal (명령어 취소용)
   * @returns 실행 결과
   */
  async executeDomainCommand(command, signal) {
    if (signal?.aborted) {
      return {
        success: false,
        error: "\uBA85\uB839\uC5B4 \uC2E4\uD589\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        displayMode: "text"
      };
    }
    if (!command.domain || command.domain === "none" /* NONE */) {
      return {
        success: false,
        error: "\uB3C4\uBA54\uC778\uC774 \uC9C0\uC815\uB418\uC9C0 \uC54A\uC740 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
        displayMode: "text"
      };
    }
    const handler = this.commandRegistry.getDomainHandler(command.domain, command.command);
    if (!handler) {
      try {
        const domainPlugin = this.pluginRegistry.getPluginByDomain(command.domain);
        if (domainPlugin && domainPlugin.isEnabled()) {
          return this.executePluginCommand({
            ...command,
            agentId: domainPlugin.id
          }, signal);
        }
      } catch (e) {
      }
      const domainCommands = this.commandRegistry.getDomainCommands(command.domain);
      const suggestions = domainCommands.length > 0 ? domainCommands.slice(0, 3).map((u) => `@${command.domain}:${u.command}`) : [`@${command.domain}:help`];
      return {
        success: false,
        error: `\uB3C4\uBA54\uC778 \uBA85\uB839\uC5B4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C: @${command.domain}:${command.command}`,
        displayMode: "text",
        suggestedNextCommands: suggestions
      };
    }
    try {
      console.log(`\uB3C4\uBA54\uC778 \uBA85\uB839\uC5B4 \uC2E4\uD589: @${command.domain}:${command.command}`);
      const result = await handler(command.args, command.flags);
      if (signal?.aborted) {
        return {
          success: false,
          error: "\uBA85\uB839\uC5B4 \uC2E4\uD589\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          displayMode: "text"
        };
      }
      return this.normalizeResult(result);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: "text"
      };
    }
  }
  /**
   * 명령어 실행 (문자열 입력 방식)
   * @param commandString 명령어 문자열
   * @param args 명령어 인자 (선택적)
   * @param flags 명령어 플래그 (선택적)
   * @returns 실행 결과
   */
  async executeFromString(commandString, args = [], flags = {}) {
    try {
      const parsedCommand = this.parser.parseWithSuggestions(commandString);
      if (parsedCommand.hasError) {
        return {
          success: false,
          error: parsedCommand.errorMessage || "\uBA85\uB839\uC5B4 \uD30C\uC2F1 \uC624\uB958",
          displayMode: "text",
          suggestedNextCommands: parsedCommand.suggestions || []
        };
      }
      const command = {
        prefix: parsedCommand.prefix,
        type: parsedCommand.type,
        domain: parsedCommand.domain,
        agentId: parsedCommand.domain !== "none" /* NONE */ ? parsedCommand.domain : "core",
        command: parsedCommand.command,
        subCommand: parsedCommand.subCommand || "",
        args: args.length > 0 ? args : parsedCommand.args,
        flags: flags && Object.keys(flags).length > 0 ? flags : Object.fromEntries(parsedCommand.flags),
        options: Object.fromEntries(parsedCommand.options),
        rawInput: parsedCommand.raw
      };
      return await this.execute(command);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: "text"
      };
    }
  }
  /**
   * 명령어 실행 (직접 문자열 명령어 실행) - 레거시 호환성 유지용
   * @param commandString 명령어 문자열
   * @param args 명령어 인자 (선택적)
   * @param flags 명령어 플래그 (선택적)
   * @returns 실행 결과
   */
  async executeCommandString(commandString, args = [], flags = {}) {
    return this.executeFromString(commandString, args, flags);
  }
  /**
   * 실행 이력 조회
   * @param limit 조회할 이력 수 (기본값: 10)
   * @returns 최근 실행 이력
   */
  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(-limit).map(({ command, result, timestamp }) => ({ command, result, timestamp }));
  }
  /**
   * 명령어 실행 취소
   * @param commandId 취소할 명령어 ID
   * @returns 취소 성공 여부
   */
  cancel(commandId) {
    const pendingCommand = this.pendingCommands.get(commandId);
    if (!pendingCommand) {
      return false;
    }
    try {
      pendingCommand.cancel();
      this.pendingCommands.delete(commandId);
      return true;
    } catch (error) {
      console.error("\uBA85\uB839\uC5B4 \uCDE8\uC18C \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return false;
    }
  }
  /**
   * 모든 명령어 취소
   * @returns 취소된 명령어 수
   */
  cancelAll() {
    let cancelCount = 0;
    this.pendingCommands.forEach((pendingCommand, commandId) => {
      try {
        pendingCommand.cancel();
        this.pendingCommands.delete(commandId);
        cancelCount++;
      } catch (error) {
        console.error(`\uBA85\uB839\uC5B4 \uCDE8\uC18C \uC911 \uC624\uB958 \uBC1C\uC0DD (${commandId}):`, error);
      }
    });
    return cancelCount;
  }
};

// src/core/utils/LoggerService.ts
var vscode = __toESM(require("vscode"));
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  LogLevel2[LogLevel2["NONE"] = 4] = "NONE";
  return LogLevel2;
})(LogLevel || {});
var LoggerService = class {
  constructor() {
    this._outputChannel = null;
    this._config = {
      level: 1 /* INFO */,
      useConsole: true,
      useOutputChannel: false
    };
    try {
      if (vscode && vscode.window) {
        this._outputChannel = vscode.window.createOutputChannel("APE");
        this._config.useOutputChannel = true;
      }
    } catch (error) {
      this._config.useOutputChannel = false;
    }
  }
  static getInstance() {
    if (!LoggerService._instance) {
      LoggerService._instance = new LoggerService();
    }
    return LoggerService._instance;
  }
  configure(config) {
    this._config = { ...this._config, ...config };
  }
  debug(message, ...optionalParams) {
    this.log(0 /* DEBUG */, message, ...optionalParams);
  }
  info(message, ...optionalParams) {
    this.log(1 /* INFO */, message, ...optionalParams);
  }
  warn(message, ...optionalParams) {
    this.log(2 /* WARN */, message, ...optionalParams);
  }
  error(message, ...optionalParams) {
    this.log(3 /* ERROR */, message, ...optionalParams);
  }
  log(level, message, ...optionalParams) {
    if (level < this._config.level) {
      return;
    }
    const levelStr = LogLevel[level];
    const formattedMessage = `[${levelStr}] ${message}`;
    if (this._config.useConsole) {
      switch (level) {
        case 0 /* DEBUG */:
          console.debug(message);
          break;
        case 1 /* INFO */:
          console.info(message);
          break;
        case 2 /* WARN */:
          console.warn(message);
          break;
        case 3 /* ERROR */:
          console.error(message, ...optionalParams);
          break;
      }
    }
    if (this._config.useOutputChannel && this._outputChannel) {
      let outputStr = formattedMessage;
      if (optionalParams.length > 0) {
        try {
          outputStr += " " + optionalParams.map((p) => {
            if (typeof p === "object") {
              return JSON.stringify(p);
            }
            return String(p);
          }).join(" ");
        } catch (error) {
          outputStr += " [Parameter serialization error]";
        }
      }
      this._outputChannel.appendLine(outputStr);
    }
  }
  show(preserveFocus = false) {
    if (this._outputChannel) {
      this._outputChannel.show(preserveFocus);
    }
  }
  hide() {
    if (this._outputChannel) {
      this._outputChannel.hide();
    }
  }
  clear() {
    if (this._outputChannel) {
      this._outputChannel.clear();
    }
  }
  setLevel(level) {
    this._config.level = level;
  }
  getLevel() {
    return this._config.level;
  }
};

// src/core/command/CommandService.ts
var import_events3 = require("events");

// src/core/plugin-system/PluginRegistryService.ts
var import_events2 = require("events");
var PluginRegistryService = class {
  /**
   * 플러그인 레지스트리 생성자
   * @param configLoader 설정 로더
   */
  constructor(configLoader) {
    this.configLoader = configLoader;
    this.eventEmitter = new import_events2.EventEmitter();
    /**
     * 내부 플러그인 맵
     */
    this._internalPlugins = /* @__PURE__ */ new Map();
    /**
     * 외부 플러그인 맵
     */
    this._externalPlugins = /* @__PURE__ */ new Map();
  }
  /**
   * 이벤트 리스너 등록 메서드
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * 이벤트 리스너 제거 메서드
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
  /**
   * 도메인으로 플러그인 가져오기
   * @param domain 플러그인 도메인
   * @returns 플러그인 또는 undefined
   */
  getPluginByDomain(domain) {
    return this.getAllPlugins().find((plugin) => plugin.getDomain() === domain);
  }
  /**
   * 플러그인 등록
   * @param plugin 등록할 플러그인
   * @param type 플러그인 타입 (기본: 외부)
   * @returns 등록 성공 여부
   */
  registerPlugin(plugin, type = "external" /* EXTERNAL */) {
    try {
      if (!plugin || !plugin.id) {
        console.error("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD50C\uB7EC\uADF8\uC778:", plugin);
        return false;
      }
      console.log("\uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2DC\uB3C4:", {
        id: plugin.id,
        name: plugin.name,
        methods: Object.getOwnPropertyNames(plugin),
        type
      });
      const pluginType = typeof type === "string" ? type === "internal" ? "internal" /* INTERNAL */ : "external" /* EXTERNAL */ : type;
      const pluginMap = pluginType === "internal" /* INTERNAL */ ? this._internalPlugins : this._externalPlugins;
      if (pluginMap.has(plugin.id)) {
        console.warn(`\uC774\uBBF8 \uB4F1\uB85D\uB41C \uD50C\uB7EC\uADF8\uC778: ${plugin.id}`);
        return false;
      }
      pluginMap.set(plugin.id, plugin);
      console.log(`\uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC131\uACF5: ${plugin.id} (${pluginType})`);
      this.eventEmitter.emit("plugin-registered", { id: plugin.id, type: pluginType });
      return true;
    } catch (error) {
      console.error(`\uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC911 \uC624\uB958 \uBC1C\uC0DD (${plugin?.id}):`, error);
      console.error("\uC624\uB958 \uC138\uBD80 \uC815\uBCF4:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return false;
    }
  }
  /**
   * 플러그인 제거
   * @param pluginId 플러그인 ID
   * @param type 플러그인 타입 (기본: 외부)
   * @returns 제거 성공 여부
   */
  unregisterPlugin(pluginId, type = "external" /* EXTERNAL */) {
    try {
      const pluginType = typeof type === "string" ? type === "internal" ? "internal" /* INTERNAL */ : "external" /* EXTERNAL */ : type;
      const pluginMap = pluginType === "internal" /* INTERNAL */ ? this._internalPlugins : this._externalPlugins;
      if (!pluginMap.has(pluginId)) {
        console.warn(`\uB4F1\uB85D\uB418\uC9C0 \uC54A\uC740 \uD50C\uB7EC\uADF8\uC778: ${pluginId}`);
        return false;
      }
      pluginMap.delete(pluginId);
      this.eventEmitter.emit("plugin-unregistered", { id: pluginId, type: pluginType });
      return true;
    } catch (error) {
      console.error(`\uD50C\uB7EC\uADF8\uC778 \uC81C\uAC70 \uC911 \uC624\uB958 \uBC1C\uC0DD (${pluginId}):`, error);
      return false;
    }
  }
  /**
   * 플러그인 가져오기
   * @param pluginId 플러그인 ID
   * @returns 플러그인 또는 undefined
   */
  getPlugin(pluginId) {
    return this._internalPlugins.get(pluginId) || this._externalPlugins.get(pluginId);
  }
  /**
   * 내부 플러그인 목록 가져오기
   * @returns 내부 플러그인 목록
   */
  getInternalPlugins() {
    return Array.from(this._internalPlugins.values());
  }
  /**
   * 외부 플러그인 목록 가져오기
   * @returns 외부 플러그인 목록
   */
  getExternalPlugins() {
    return Array.from(this._externalPlugins.values());
  }
  /**
   * 모든 플러그인 가져오기
   * @returns 플러그인 목록
   */
  getAllPlugins() {
    return [...this.getInternalPlugins(), ...this.getExternalPlugins()];
  }
  /**
   * 활성화된 플러그인 목록 가져오기
   * @returns 활성화된 플러그인 목록
   */
  getEnabledPlugins() {
    return this.getAllPlugins().filter((plugin) => plugin.isEnabled());
  }
  /**
   * 모든 플러그인 명령어 가져오기
   * @returns 명령어 목록
   */
  getAllCommands() {
    const commands4 = [];
    for (const plugin of this.getAllPlugins()) {
      if (plugin.isEnabled()) {
        commands4.push(...plugin.getCommands());
      }
    }
    return commands4;
  }
  /**
   * 모든 플러그인 초기화
   * @returns 초기화 성공 여부
   */
  async initialize() {
    try {
      for (const plugin of this.getAllPlugins()) {
        if (plugin.isEnabled()) {
          try {
            await plugin.initialize();
          } catch (error) {
            console.error(`\uD50C\uB7EC\uADF8\uC778 \uCD08\uAE30\uD654 \uC911 \uC624\uB958 \uBC1C\uC0DD (${plugin.id}):`, error);
          }
        }
      }
      this.eventEmitter.emit("plugins-initialized");
      return true;
    } catch (error) {
      console.error("\uD50C\uB7EC\uADF8\uC778 \uCD08\uAE30\uD654 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return false;
    }
  }
  /**
   * 명령어로 플러그인 및 메서드 찾기
   * @param pluginId 플러그인 ID
   * @param commandName 명령어 이름
   * @returns 플러그인과 명령어 정보
   */
  findCommand(pluginId, commandName) {
    const plugin = this.getPlugin(pluginId);
    if (!plugin || !plugin.isEnabled()) {
      return null;
    }
    const command = plugin.getCommands().find((cmd) => cmd.name === commandName || cmd.id === commandName);
    if (!command) {
      return null;
    }
    return { plugin, command };
  }
  /**
   * 명령어 실행
   * @param pluginId 플러그인 ID
   * @param commandName 명령어 이름
   * @param args 명령어 인자
   * @returns 실행 결과
   */
  async executeCommand(pluginId, commandName, args) {
    const found = this.findCommand(pluginId, commandName);
    if (!found) {
      throw new Error(`\uBA85\uB839\uC5B4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${pluginId}:${commandName}`);
    }
    return await found.plugin.executeCommand(commandName, args);
  }
  /**
   * 외부 플러그인 로드
   * 참고: 실제 구현은 ExternalPluginLoader 클래스에서 처리
   * @returns 로드된 플러그인 수
   */
  async loadExternalPlugins() {
    try {
      const pluginsConfig = this.configLoader.getPluginConfig();
      if (!pluginsConfig) {
        console.log("\uC678\uBD80 \uD50C\uB7EC\uADF8\uC778 \uC124\uC815\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
        return 0;
      }
      return this._externalPlugins.size;
    } catch (error) {
      console.error("\uC678\uBD80 \uD50C\uB7EC\uADF8\uC778 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return 0;
    }
  }
};

// src/core/command/CommandService.ts
var CommandService = class extends import_events3.EventEmitter {
  /**
   * CommandService 생성자
   * @param configLoader 설정 로더 서비스
   * @param coreService 코어 서비스 인스턴스
   */
  constructor(configLoader, coreService2) {
    super();
    this.coreService = coreService2;
    this.contextCache = /* @__PURE__ */ new Map();
    this.preferenceCache = /* @__PURE__ */ new Map();
    this.logger = new LoggerService();
    const pluginRegistry = new PluginRegistryService(configLoader);
    this.registry = new CommandRegistryService(pluginRegistry);
    this.executor = new CommandExecutorService(this.registry, pluginRegistry);
    this.parser = new CommandParserService();
    this.logger.info("CommandService \uCD08\uAE30\uD654\uB428");
    setInterval(() => this.refreshAllContexts(), 3e4);
    this.logger.info("\uC0DD\uC131\uC790 \uAE30\uBC18 \uC758\uC874\uC131 \uC8FC\uC785\uC73C\uB85C \uCF54\uC5B4 \uC11C\uBE44\uC2A4 \uCC38\uC870 \uC124\uC815\uB428");
  }
  /**
   * 초기화
   */
  async initialize() {
    if (typeof this.registry.initialize === "function") {
      await this.registry.initialize();
    }
    await this.refreshAllContexts();
    this.logger.info("CommandService \uC644\uC804\uD788 \uCD08\uAE30\uD654\uB428");
  }
  /**
   * 명령어 실행
   * @param command 실행할 명령어 문자열
   * @returns 명령어 실행 결과
   */
  async executeCommand(command) {
    try {
      this.logger.debug(`\uBA85\uB839\uC5B4 \uC2E4\uD589: ${command}`);
      const parsedCommand = this.parser.parse(command);
      if (!parsedCommand) {
        return {
          content: `\uBA85\uB839\uC5B4 \uD30C\uC2F1 \uC2E4\uD328: ${command}`,
          error: true
        };
      }
      return await this.executor.execute(parsedCommand);
    } catch (error) {
      this.logger.error(`\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC911 \uC624\uB958 \uBC1C\uC0DD: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: `\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC911 \uC624\uB958 \uBC1C\uC0DD: ${error instanceof Error ? error.message : String(error)}`,
        error: true
      };
    }
  }
  /**
   * 모든 플러그인의 컨텍스트 정보 새로고침
   */
  async refreshAllContexts() {
    try {
      await this.refreshGitContext();
      await this.refreshJiraContext();
      await this.refreshSwdpContext();
      await this.refreshPocketContext();
      this.emit("contexts-updated");
    } catch (error) {
      this.logger.error("\uCEE8\uD14D\uC2A4\uD2B8 \uC815\uBCF4 \uC0C8\uB85C\uACE0\uCE68 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * Git 플러그인 컨텍스트 새로고침
   */
  async refreshGitContext() {
    try {
      const plugin = this.registry.getPlugin("git");
      if (!plugin)
        return;
      const gitClient = plugin.client;
      if (!gitClient)
        return;
      const status = await gitClient.getStatus();
      const branches = await gitClient.getBranches(true);
      this.contextCache.set("git", {
        status,
        branches,
        lastUpdated: /* @__PURE__ */ new Date()
      });
      this.logger.debug("Git \uCEE8\uD14D\uC2A4\uD2B8 \uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8\uB428");
    } catch (error) {
      this.logger.error("Git \uCEE8\uD14D\uC2A4\uD2B8 \uC0C8\uB85C\uACE0\uCE68 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * Jira 플러그인 컨텍스트 새로고침
   */
  async refreshJiraContext() {
    try {
      const plugin = this.registry.getPlugin("jira");
      if (!plugin || !plugin.client)
        return;
      const jiraClient = plugin.client;
      this.contextCache.set("jira", {
        lastUpdated: /* @__PURE__ */ new Date()
      });
      this.logger.debug("Jira \uCEE8\uD14D\uC2A4\uD2B8 \uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8\uB428");
    } catch (error) {
      this.logger.error("Jira \uCEE8\uD14D\uC2A4\uD2B8 \uC0C8\uB85C\uACE0\uCE68 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * SWDP 플러그인 컨텍스트 새로고침
   */
  async refreshSwdpContext() {
    try {
      const plugin = this.registry.getPlugin("swdp");
      if (!plugin || !plugin.swdpClient)
        return;
      this.contextCache.set("swdp", {
        lastUpdated: /* @__PURE__ */ new Date()
      });
      this.logger.debug("SWDP \uCEE8\uD14D\uC2A4\uD2B8 \uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8\uB428");
    } catch (error) {
      this.logger.error("SWDP \uCEE8\uD14D\uC2A4\uD2B8 \uC0C8\uB85C\uACE0\uCE68 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * Pocket 플러그인 컨텍스트 새로고침
   */
  async refreshPocketContext() {
    try {
      const plugin = this.registry.getPlugin("pocket");
      if (!plugin || !plugin.client)
        return;
      this.contextCache.set("pocket", {
        lastUpdated: /* @__PURE__ */ new Date()
      });
      this.logger.debug("Pocket \uCEE8\uD14D\uC2A4\uD2B8 \uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8\uB428");
    } catch (error) {
      this.logger.error("Pocket \uCEE8\uD14D\uC2A4\uD2B8 \uC0C8\uB85C\uACE0\uCE68 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * 실시간 컨텍스트 기반 명령어 생성
   * 사용자가 직접 인자를 입력하지 않아도 되도록 완성된 명령어 제공
   * 
   * @param baseCommand 기본 명령어 (예: '@git:commit')
   * @param context 실행 컨텍스트 및 환경 정보
   * @returns 완성된 명령어 문자열 또는 후보 목록
   */
  async generateContextualCommand(baseCommand, context) {
    try {
      if (!baseCommand) {
        return "";
      }
      const parts = baseCommand.split(":");
      const pluginPrefix = parts.length > 0 ? parts[0] : "";
      const commandName = parts.length > 1 ? parts[1] : "";
      if (!pluginPrefix || !commandName) {
        return baseCommand;
      }
      const pluginId = pluginPrefix.replace("@", "");
      const command = this.registry.findCommand(pluginId, commandName);
      if (!command) {
        return baseCommand;
      }
      if (pluginId === "git") {
        return this.generateGitCommand(commandName, context);
      } else if (pluginId === "jira") {
        return this.generateJiraCommand(commandName, context);
      } else if (pluginId === "swdp") {
        return this.generateSwdpCommand(commandName, context);
      } else if (pluginId === "pocket") {
        return this.generatePocketCommand(commandName, context);
      }
      return baseCommand;
    } catch (error) {
      this.logger.error(`\uCEE8\uD14D\uC2A4\uD2B8 \uBA85\uB839\uC5B4 \uC0DD\uC131 \uC911 \uC624\uB958: ${error}`);
      return baseCommand;
    }
  }
  /**
   * Git 명령어 자동 생성
   * 현재 Git 상태에 따라 최적화된 명령어 생성
   * 
   * @param commandName Git 명령어 이름
   * @param context 컨텍스트 정보
   * @returns 완성된 Git 명령어 또는 후보 목록
   */
  async generateGitCommand(commandName, context) {
    const gitPlugin = this.registry.getPlugin("git");
    if (!gitPlugin) {
      return `@git:${commandName}`;
    }
    const gitClient = gitPlugin.client;
    if (!gitClient) {
      return `@git:${commandName}`;
    }
    try {
      const gitContext = this.contextCache.get("git") || {};
      const status = gitContext.status || await gitClient.getStatus();
      const branches = gitContext.branches || await gitClient.getBranches(true);
      switch (commandName) {
        case "commit": {
          if (!status.changes || status.changes.length === 0) {
            return '@git:commit "\uBCC0\uACBD \uC0AC\uD56D \uC5C6\uC74C" --empty';
          }
          const fileNames = status.changes.map((change) => change.path).join(", ");
          const suggestedMessage = `${fileNames}\uC758 \uBCC0\uACBD \uC0AC\uD56D`;
          return `@git:commit "${suggestedMessage}"`;
        }
        case "push": {
          const currentBranch = status.branch;
          if (status.tracking) {
            return `@git:push origin ${currentBranch}`;
          } else {
            return `@git:push origin ${currentBranch} --set-upstream`;
          }
        }
        case "checkout": {
          const otherBranches = branches.filter((branch) => !branch.isCurrent).map((branch) => `@git:checkout ${branch.name}`);
          const priorityBranches = ["main", "develop", "master"];
          otherBranches.sort((a, b) => {
            const branchA = a.split(" ")[1];
            const branchB = b.split(" ")[1];
            const priorityA = priorityBranches.indexOf(branchA);
            const priorityB = priorityBranches.indexOf(branchB);
            if (priorityA !== -1 && priorityB !== -1) {
              return priorityA - priorityB;
            } else if (priorityA !== -1) {
              return -1;
            } else if (priorityB !== -1) {
              return 1;
            }
            return 0;
          });
          return otherBranches.length > 0 ? otherBranches : "@git:checkout";
        }
        case "branch": {
          const currentBranch = status.branch;
          const prefixMatch = currentBranch.match(/^(feature|bugfix|hotfix|release|support)\//);
          const prefix = prefixMatch ? prefixMatch[1] : "feature";
          let userName = "";
          try {
            const configResult = await gitClient.executeGitCommand(["config", "user.name"]);
            if (configResult.success && configResult.stdout) {
              userName = configResult.stdout.trim().split(" ")[0].toLowerCase();
              if (userName.length > 8) {
                userName = userName.charAt(0);
              }
            }
          } catch (error) {
          }
          const date = /* @__PURE__ */ new Date();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const dateStr = month + day;
          let branchPattern = "";
          if (userName) {
            branchPattern = `${prefix}/${userName}/${dateStr}/`;
          } else {
            branchPattern = `${prefix}/${dateStr}/`;
          }
          return `@git:branch ${branchPattern}`;
        }
        default:
          return `@git:${commandName}`;
      }
    } catch (error) {
      this.logger.error(`Git \uBA85\uB839\uC5B4 \uC0DD\uC131 \uC911 \uC624\uB958: ${error}`);
      return `@git:${commandName}`;
    }
  }
  /**
   * Jira 명령어 자동 생성
   * 현재 Jira 상태에 따라 최적화된 명령어 생성
   * 
   * @param commandName Jira 명령어 이름
   * @param context 컨텍스트 정보
   * @returns 완성된 Jira 명령어 또는 후보 목록
   */
  async generateJiraCommand(commandName, context) {
    const jiraPlugin = this.registry.getPlugin("jira");
    if (!jiraPlugin) {
      return `@jira:${commandName}`;
    }
    const gitPlugin = this.registry.getPlugin("git");
    try {
      switch (commandName) {
        case "issue": {
          if (gitPlugin) {
            const gitClient = gitPlugin.client;
            if (gitClient) {
              const gitContext = this.contextCache.get("git");
              const status = gitContext?.status || await gitClient.getStatus();
              const currentBranch = status.branch;
              this.logger.info(`\uD604\uC7AC Git \uBE0C\uB79C\uCE58: ${currentBranch}`);
              const branchIssueKeyMatch = currentBranch.match(/[A-Z]+-\d+/);
              if (branchIssueKeyMatch) {
                const issueKey = branchIssueKeyMatch[0];
                this.logger.info(`\uBE0C\uB79C\uCE58 \uC774\uB984\uC5D0\uC11C \uC774\uC288 \uD0A4 \uBC1C\uACAC: ${issueKey}`);
                if (!this.contextCache.has("jira")) {
                  this.contextCache.set("jira", {});
                }
                const jiraContext2 = this.contextCache.get("jira");
                jiraContext2.lastIssueKey = issueKey;
                jiraContext2.lastIssueKeySource = "branch";
                jiraContext2.lastUpdated = /* @__PURE__ */ new Date();
                return `@jira:issue ${issueKey}`;
              }
              const jiraContext = this.contextCache.get("jira");
              if (jiraContext?.lastIssueKey && jiraContext.lastUpdated && (/* @__PURE__ */ new Date()).getTime() - jiraContext.lastUpdated.getTime() < 5 * 60 * 1e3) {
                this.logger.info(`\uCE90\uC2DC\uB41C \uC774\uC288 \uD0A4 \uC0AC\uC6A9: ${jiraContext.lastIssueKey} (\uCD9C\uCC98: ${jiraContext.lastIssueKeySource})`);
                return `@jira:issue ${jiraContext.lastIssueKey}`;
              }
              try {
                const logResult = await gitClient.executeGitCommand(["log", "-n", "10", "--pretty=format:%s"]);
                if (logResult.success && logResult.stdout) {
                  const recentCommits = logResult.stdout.split("\n");
                  this.logger.info(`\uCD5C\uADFC \uCEE4\uBC0B \uB85C\uADF8 ${recentCommits.length}\uAC1C \uC870\uD68C\uB428`);
                  const llmService = this.coreService?.llmService;
                  this.logger.debug("LLM \uC11C\uBE44\uC2A4 \uD655\uC778: " + (llmService ? "\uC0AC\uC6A9 \uAC00\uB2A5" : "\uC0AC\uC6A9 \uBD88\uAC00"));
                  if (llmService) {
                    this.logger.info("LLM \uAE30\uBC18 \uC774\uC288 \uD0A4 \uCD94\uCD9C \uC2DC\uC791");
                    const issueKeyPrompt = {
                      messages: [
                        {
                          role: "system",
                          content: "\uB2F9\uC2E0\uC740 Git \uCEE4\uBC0B \uBA54\uC2DC\uC9C0\uC5D0\uC11C Jira \uC774\uC288 \uD0A4\uB97C \uCD94\uCD9C\uD558\uB294 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. Jira \uC774\uC288 \uD0A4\uB294 \uC77C\uBC18\uC801\uC73C\uB85C PROJ-123, ABC-456 \uAC19\uC740 \uD615\uC2DD(\uB300\uBB38\uC790 \uD504\uB85C\uC81D\uD2B8 \uCF54\uB4DC, \uD558\uC774\uD508, \uC22B\uC790)\uC785\uB2C8\uB2E4.\n\n\uD300\uB9C8\uB2E4 \uB2E4\uC591\uD55C \uD3EC\uB9F7\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4:\n- [KEY-123] \uBA54\uC2DC\uC9C0\n- KEY-123: \uBA54\uC2DC\uC9C0\n- #KEY-123 \uBA54\uC2DC\uC9C0\n- (KEY-123) \uBA54\uC2DC\uC9C0\n- fix(KEY-123): \uBA54\uC2DC\uC9C0\n- 'feat: \uAE30\uB2A5 \uAD6C\uD604 (KEY-123)'\n- 'Implement feature KEY-123'\n\n\uAC00\uC7A5 \uCD5C\uADFC\uC758 \uAD00\uB828 \uC774\uC288 \uD0A4 \uD558\uB098\uB9CC \uCD94\uCD9C\uD574 \uC8FC\uC138\uC694. \uC804\uCCB4 \uCEE4\uBC0B \uBA54\uC2DC\uC9C0\uB97C \uC77D\uACE0 \uAC00\uC7A5 \uAD00\uB828\uC131\uC774 \uB192\uC740 \uC774\uC288 \uD0A4\uB97C \uC120\uD0DD\uD558\uC138\uC694."
                        },
                        {
                          role: "user",
                          content: `\uB2E4\uC74C Git \uCEE4\uBC0B \uBA54\uC2DC\uC9C0 \uBAA9\uB85D\uC5D0\uC11C \uAC00\uC7A5 \uCD5C\uADFC\uC758 Jira \uC774\uC288 \uD0A4\uB9CC \uD558\uB098 \uCD94\uCD9C\uD574\uC8FC\uC138\uC694. \uC5C6\uC73C\uBA74 '\uC5C6\uC74C'\uC774\uB77C\uACE0 \uC751\uB2F5\uD558\uC138\uC694. \uC751\uB2F5\uC740 \uC774\uC288 \uD0A4\uB9CC \uAC04\uACB0\uD558\uAC8C \uC791\uC131\uD574\uC8FC\uC138\uC694.

${recentCommits.join("\n")}`
                        }
                      ]
                    };
                    this.logger.debug("LLM \uC694\uCCAD \uD504\uB86C\uD504\uD2B8:");
                    this.logger.debug(`\uC2DC\uC2A4\uD15C: ${issueKeyPrompt.messages[0].content.slice(0, 100)}...`);
                    this.logger.debug(`\uC0AC\uC6A9\uC790: ${issueKeyPrompt.messages[1].content.slice(0, 100)}...`);
                    try {
                      this.logger.info("LLM API \uD638\uCD9C \uC2DC\uC791");
                      const llmStartTime = Date.now();
                      const response = await llmService.sendRequest({
                        model: "claude-3-haiku-20240307",
                        messages: issueKeyPrompt.messages,
                        temperature: 0,
                        max_tokens: 50
                      });
                      const llmDuration = Date.now() - llmStartTime;
                      this.logger.info(`LLM \uC751\uB2F5 \uC218\uC2E0 \uC644\uB8CC (\uC18C\uC694\uC2DC\uAC04: ${llmDuration}ms)`);
                      if (response && response.content) {
                        const content = response.content.trim();
                        this.logger.debug(`LLM \uC751\uB2F5 \uB0B4\uC6A9: "${content}"`);
                        if (content.toLowerCase() !== "\uC5C6\uC74C") {
                          const llmExtractedKey = content.match(/[A-Z]+-\d+/);
                          if (llmExtractedKey) {
                            const issueKey = llmExtractedKey[0];
                            this.logger.info(`LLM\uC774 \uCD94\uCD9C\uD55C \uC774\uC288 \uD0A4: ${issueKey}`);
                            if (!this.contextCache.has("jira")) {
                              this.contextCache.set("jira", {});
                            }
                            const jiraContext2 = this.contextCache.get("jira");
                            jiraContext2.lastIssueKey = issueKey;
                            jiraContext2.lastIssueKeySource = "llm";
                            jiraContext2.lastUpdated = /* @__PURE__ */ new Date();
                            return `@jira:issue ${issueKey}`;
                          } else {
                            this.logger.warn(`LLM \uC751\uB2F5\uC5D0\uC11C \uC720\uD6A8\uD55C \uC774\uC288 \uD0A4 \uD328\uD134\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC74C: "${content}"`);
                          }
                        } else {
                          this.logger.info("LLM \uC751\uB2F5: \uCEE4\uBC0B \uBA54\uC2DC\uC9C0\uC5D0\uC11C \uC774\uC288 \uD0A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C");
                        }
                      } else {
                        this.logger.warn("LLM \uC751\uB2F5\uC774 \uBE44\uC5B4\uC788\uAC70\uB098 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC74C");
                      }
                    } catch (llmError) {
                      this.logger.error("LLM \uD638\uCD9C \uC911 \uC624\uB958:", llmError);
                      this.logger.error("\uC0C1\uC138 \uC624\uB958 \uC815\uBCF4:", JSON.stringify(llmError, Object.getOwnPropertyNames(llmError)));
                      this.logger.info("\uD734\uB9AC\uC2A4\uD2F1 \uBC29\uC2DD\uC73C\uB85C \uB300\uCCB4 \uC791\uB3D9");
                    }
                  }
                  this.logger.info("\uD734\uB9AC\uC2A4\uD2F1 \uBC29\uC2DD\uC73C\uB85C \uC774\uC288 \uD0A4 \uAC80\uC0C9 \uC2DC\uC791");
                  const patterns = [
                    /\[([A-Z]+-\d+)\]/,
                    /([A-Z]+-\d+):/,
                    /#([A-Z]+-\d+)/,
                    /\(([A-Z]+-\d+)\)/,
                    /fix\(([A-Z]+-\d+)\)/,
                    /feat\(([A-Z]+-\d+)\)/,
                    /feat\s*:\s*\(([A-Z]+-\d+)\)/,
                    /chore\(([A-Z]+-\d+)\)/,
                    /docs\(([A-Z]+-\d+)\)/,
                    /test\(([A-Z]+-\d+)\)/,
                    /refactor\(([A-Z]+-\d+)\)/,
                    /style\(([A-Z]+-\d+)\)/,
                    /perf\(([A-Z]+-\d+)\)/,
                    /build\(([A-Z]+-\d+)\)/,
                    /ci\(([A-Z]+-\d+)\)/,
                    /^([A-Z]+-\d+)$/,
                    /([A-Z]+-\d+)/
                  ];
                  for (const commit of recentCommits) {
                    for (const pattern of patterns) {
                      const match = commit.match(pattern);
                      if (match && match[1]) {
                        const issueKey = match[1];
                        this.logger.info(`\uD734\uB9AC\uC2A4\uD2F1 \uBC29\uC2DD\uC73C\uB85C \uC774\uC288 \uD0A4 \uBC1C\uACAC: ${issueKey} (\uD328\uD134: ${pattern})`);
                        if (!this.contextCache.has("jira")) {
                          this.contextCache.set("jira", {});
                        }
                        const jiraContext2 = this.contextCache.get("jira");
                        jiraContext2.lastIssueKey = issueKey;
                        jiraContext2.lastIssueKeySource = "regex";
                        jiraContext2.lastUpdated = /* @__PURE__ */ new Date();
                        return `@jira:issue ${issueKey}`;
                      }
                    }
                  }
                  this.logger.info("\uD734\uB9AC\uC2A4\uD2F1 \uBC29\uC2DD\uC73C\uB85C\uB3C4 \uC774\uC288 \uD0A4\uB97C \uCC3E\uC9C0 \uBABB\uD568");
                }
              } catch (logError) {
                this.logger.error("Git \uB85C\uADF8 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328:", logError);
                this.logger.error("\uC0C1\uC138 \uC624\uB958 \uC815\uBCF4:", JSON.stringify(logError, Object.getOwnPropertyNames(logError)));
              }
            }
          }
          this.logger.info("\uC774\uC288 \uD0A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4 \uBE48 \uBA85\uB839\uC5B4 \uBC18\uD658");
          return "@jira:issue ";
        }
        case "create": {
          let projectCode = "PROJ";
          if (gitPlugin) {
            const gitClient = gitPlugin.client;
            if (gitClient) {
              try {
                const remoteResult = await gitClient.executeGitCommand(["remote", "get-url", "origin"]);
                if (remoteResult.success && remoteResult.stdout) {
                  const repoName = remoteResult.stdout.trim().split("/").pop()?.replace(".git", "");
                  if (repoName) {
                    projectCode = repoName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                    if (projectCode.length > 10) {
                      projectCode = projectCode.substring(0, 10);
                    }
                  }
                }
              } catch (error) {
              }
            }
          }
          return `@jira:create ${projectCode} "\uC81C\uBAA9" "\uC124\uBA85" --type=Task`;
        }
        case "search": {
          const queries = [
            `@jira:search "assignee = currentUser()"`,
            `@jira:search "project = PROJ AND status = Open"`,
            `@jira:search "created >= -7d"`
          ];
          return queries;
        }
        default:
          return `@jira:${commandName}`;
      }
    } catch (error) {
      this.logger.error(`Jira \uBA85\uB839\uC5B4 \uC0DD\uC131 \uC911 \uC624\uB958: ${error}`);
      return `@jira:${commandName}`;
    }
  }
  /**
   * SWDP 명령어 자동 생성
   * 현재 SWDP 상태에 따라 최적화된 명령어 생성
   * 
   * @param commandName SWDP 명령어 이름
   * @param context 컨텍스트 정보
   * @returns 완성된 SWDP 명령어 또는 후보 목록
   */
  async generateSwdpCommand(commandName, context) {
    const swdpPlugin = this.registry.getPlugin("swdp");
    if (!swdpPlugin) {
      return `@swdp:${commandName}`;
    }
    try {
      switch (commandName) {
        case "build": {
          const gitPlugin = this.registry.getPlugin("git");
          if (gitPlugin) {
            const gitClient = gitPlugin.client;
            if (gitClient) {
              const gitContext = this.contextCache.get("git");
              const status = gitContext?.status || await gitClient.getStatus();
              if (status.branch === "main" || status.branch === "master") {
                return "@swdp:build all";
              } else if (status.branch.startsWith("feature/")) {
                return "@swdp:build local --watch";
              } else if (status.branch.startsWith("release/")) {
                return "@swdp:build layer";
              }
            }
          }
          return [
            "@swdp:build local",
            "@swdp:build local --watch",
            "@swdp:build layer",
            "@swdp:build all"
          ];
        }
        case "build-status": {
          const swdpContext = this.contextCache.get("swdp") || {};
          const recentBuildId = swdpContext.recentBuildId || "12345";
          return `@swdp:build:status ${recentBuildId}`;
        }
        case "test": {
          return [
            "@swdp:test unit",
            "@swdp:test integration",
            "@swdp:test system"
          ];
        }
        default:
          return `@swdp:${commandName}`;
      }
    } catch (error) {
      this.logger.error(`SWDP \uBA85\uB839\uC5B4 \uC0DD\uC131 \uC911 \uC624\uB958: ${error}`);
      return `@swdp:${commandName}`;
    }
  }
  /**
   * Pocket 명령어 자동 생성
   * 현재 Pocket 상태에 따라 최적화된 명령어 생성
   * 
   * @param commandName Pocket 명령어 이름
   * @param context 컨텍스트 정보
   * @returns 완성된 Pocket 명령어 또는 후보 목록
   */
  async generatePocketCommand(commandName, context) {
    const pocketPlugin = this.registry.getPlugin("pocket");
    if (!pocketPlugin) {
      return `@pocket:${commandName}`;
    }
    try {
      switch (commandName) {
        case "ls": {
          return [
            "@pocket:ls docs/",
            "@pocket:ls config/",
            "@pocket:ls reports/",
            "@pocket:ls "
          ];
        }
        case "load": {
          const gitPlugin = this.registry.getPlugin("git");
          if (gitPlugin) {
            const gitClient = gitPlugin.client;
            if (gitClient) {
              try {
                const remoteResult = await gitClient.executeGitCommand(["remote", "get-url", "origin"]);
                if (remoteResult.success && remoteResult.stdout) {
                  const repoName = remoteResult.stdout.trim().split("/").pop()?.replace(".git", "");
                  if (repoName) {
                    return `@pocket:load ${repoName}.json`;
                  }
                }
              } catch (error) {
              }
            }
          }
          return [
            "@pocket:load config.json",
            "@pocket:load README.md",
            "@pocket:load settings.json"
          ];
        }
        case "search": {
          const gitPlugin = this.registry.getPlugin("git");
          if (gitPlugin) {
            const gitClient = gitPlugin.client;
            if (gitClient) {
              try {
                const remoteResult = await gitClient.executeGitCommand(["remote", "get-url", "origin"]);
                if (remoteResult.success && remoteResult.stdout) {
                  const repoName = remoteResult.stdout.trim().split("/").pop()?.replace(".git", "");
                  if (repoName) {
                    return `@pocket:search ${repoName}`;
                  }
                }
              } catch (error) {
              }
            }
          }
          return "@pocket:search ";
        }
        default:
          return `@pocket:${commandName}`;
      }
    } catch (error) {
      this.logger.error(`Pocket \uBA85\uB839\uC5B4 \uC0DD\uC131 \uC911 \uC624\uB958: ${error}`);
      return `@pocket:${commandName}`;
    }
  }
  /**
   * 명령어 Registry 서비스 가져오기
   * @returns 명령어 Registry 서비스
   */
  getCommandRegistry() {
    return this.registry;
  }
  /**
   * 명령어 Executor 서비스 가져오기
   * @returns 명령어 Executor 서비스
   */
  getCommandExecutor() {
    return this.executor;
  }
  /**
   * 현재 컨텍스트 캐시 상태 가져오기
   * @returns 컨텍스트 캐시 맵
   */
  getContextCache() {
    return this.contextCache;
  }
  /**
   * 사용자 선호도 데이터 업데이트
   * @param pluginId 플러그인 ID
   * @param commandName 명령어 이름
   * @param args 사용된 인자
   */
  updatePreference(pluginId, commandName, args) {
    if (!this.preferenceCache.has(pluginId)) {
      this.preferenceCache.set(pluginId, /* @__PURE__ */ new Map());
    }
    const pluginPrefs = this.preferenceCache.get(pluginId);
    if (!pluginPrefs.has(commandName)) {
      pluginPrefs.set(commandName, []);
    }
    const cmdPrefs = pluginPrefs.get(commandName);
    cmdPrefs.unshift(args);
    if (cmdPrefs.length > 5) {
      cmdPrefs.pop();
    }
  }
};

// src/core/config/ConfigService.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var ConfigService = class {
  /**
   * ConfigService 생성자
   * @param context VSCode 확장 컨텍스트 (CLI 환경에서는 null)
   */
  constructor(context) {
    this.context = context;
    /**
     * 설정 객체
     */
    this.config = {};
    /**
     * JSON 스키마 맵
     */
    this.schemas = /* @__PURE__ */ new Map();
    if (context) {
      try {
        if (typeof require("vscode") !== "undefined" && require("vscode").workspace) {
          const vscode10 = require("vscode");
          const workspaceFolders = vscode10.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            this.configPath = path.join(workspaceFolders[0].uri.fsPath, "settings.json");
            return;
          }
        }
      } catch (e) {
      }
      if (this.context && this.context.extensionPath) {
        this.configPath = path.join(this.context.extensionPath, "settings.json");
      } else {
        this.configPath = path.join(process.cwd(), "settings.json");
      }
    } else {
      this.configPath = path.join(process.cwd(), "settings.json");
    }
    this.loadDefaultSchemas();
  }
  /**
   * 싱글톤 인스턴스 가져오기
   * @deprecated 싱글톤 패턴 대신 의존성 주입 사용 권장
   * @returns ConfigService 인스턴스
   */
  static getInstance() {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  /**
   * 팩토리 메서드: 인스턴스 생성
   * @param context VSCode 확장 컨텍스트 (CLI 환경에서는 null)
   * @returns ConfigService 인스턴스
   */
  static createInstance(context) {
    return new ConfigService(context);
  }
  /**
   * 설정 로드
   * settings.json 파일을 로드하고 유효성 검증
   * @returns 로드 성공 여부
   */
  async load() {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.log("\uC124\uC815 \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uD15C\uD50C\uB9BF \uD30C\uC77C\uB85C\uBD80\uD130 \uAE30\uBCF8 \uC124\uC815\uC744 \uC0DD\uC131\uD569\uB2C8\uB2E4.");
        let templatePath = "";
        if (this.context) {
          templatePath = path.join(this.context.extensionPath, "settings.json.template");
        } else {
          const possiblePaths = [
            path.join(process.cwd(), "settings.json.template"),
            path.join(__dirname, "..", "..", "..", "settings.json.template")
          ];
          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              templatePath = p;
              break;
            }
          }
        }
        if (!templatePath || !fs.existsSync(templatePath)) {
          console.error("\uD15C\uD50C\uB9BF \uC124\uC815 \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC74C");
          return false;
        }
        fs.copyFileSync(templatePath, this.configPath);
        console.log(`\uAE30\uBCF8 \uC124\uC815 \uD30C\uC77C\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4: ${this.configPath}`);
      }
      const configContent = fs.readFileSync(this.configPath, "utf8");
      this.config = JSON.parse(configContent);
      const localConfigPath = path.join(path.dirname(this.configPath), "settings.local.json");
      if (fs.existsSync(localConfigPath)) {
        try {
          const localConfigContent = fs.readFileSync(localConfigPath, "utf8");
          const localConfig = JSON.parse(localConfigContent);
          this.mergeDeep(this.config, localConfig);
          console.log("\uB85C\uCEEC \uC124\uC815\uC774 \uB85C\uB4DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4:", localConfigPath);
        } catch (localError) {
          console.warn("\uB85C\uCEEC \uC124\uC815 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", localError);
        }
      }
      const isValid = await this.validate(this.config);
      if (!isValid) {
        console.error("\uC124\uC815 \uD30C\uC77C \uC720\uD6A8\uC131 \uAC80\uC99D \uC2E4\uD328");
        return false;
      }
      return true;
    } catch (error) {
      console.error("\uC124\uC815 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return false;
    }
  }
  /**
   * 객체 깊은 병합 (두 번째 객체의 속성을 첫 번째 객체에 병합)
   * @param target 대상 객체
   * @param source 소스 객체
   * @returns 병합된 객체
   */
  mergeDeep(target, source) {
    if (!source)
      return target;
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
          if (!target[key])
            Object.assign(target, { [key]: {} });
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    return target;
  }
  /**
   * 특정 섹션의 설정 가져오기
   * @param section 설정 섹션 경로
   * @returns 설정 섹션 객체
   */
  getSection(section) {
    return this.get(section, {});
  }
  /**
   * 코어 설정 가져오기
   * @returns 코어 설정 객체
   */
  getCoreConfig() {
    return this.getSection("core");
  }
  /**
   * 에이전트 설정 가져오기
   * @param agentId 에이전트 ID (생략 시 전체 에이전트 설정)
   * @returns 에이전트 설정 객체
   */
  getAgentConfig(agentId) {
    if (agentId) {
      return this.getSection(`agents.${agentId}`);
    }
    return this.getSection("agents");
  }
  /**
   * 플러그인 설정 가져오기
   * @param pluginId 플러그인 ID (생략 시 전체 플러그인 설정)
   * @returns 플러그인 설정 객체
   */
  getPluginConfig(pluginId) {
    if (pluginId) {
      return this.getSection(`plugins.${pluginId}`);
    }
    return this.getSection("plugins");
  }
  /**
   * 플러그인 설정 가져오기 (간단한 버전)
   * @param pluginId 플러그인 ID
   * @returns 플러그인 설정 객체 또는 null
   */
  getPlugin(pluginId) {
    try {
      const pluginConfig = this.getPluginConfig(pluginId);
      return pluginConfig;
    } catch (error) {
      console.error(`\uD50C\uB7EC\uADF8\uC778 \uC124\uC815 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328 (${pluginId}):`, error);
      return null;
    }
  }
  /**
   * 사용자 설정 가져오기
   * @returns 사용자 설정 객체
   */
  getUserConfig() {
    return this.getSection("user");
  }
  /**
   * 사용자 설정 업데이트
   * @param config 업데이트할 설정 객체
   * @returns 업데이트 성공 여부
   */
  updateUserConfig(config) {
    try {
      const userConfig = this.getUserConfig();
      const updatedConfig = { ...userConfig, ...config };
      this.set("user", updatedConfig);
      return this.save();
    } catch (error) {
      console.error("\uC0AC\uC6A9\uC790 \uC124\uC815 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return false;
    }
  }
  /**
   * 애플리케이션 설정 가져오기
   * @returns 애플리케이션 설정 객체
   */
  getAppConfig() {
    return this.getSection("app");
  }
  /**
   * 설정 업데이트
   * @param section 설정 섹션
   * @param config 업데이트할 설정 객체
   * @returns 업데이트 성공 여부
   */
  updateConfig(section, config) {
    try {
      const currentConfig = this.getSection(section);
      const updatedConfig = { ...currentConfig, ...config };
      this.set(section, updatedConfig);
      return this.save();
    } catch (error) {
      console.error(`\uC124\uC815 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958 \uBC1C\uC0DD (${section}):`, error);
      return false;
    }
  }
  /**
   * 특정 설정 값 가져오기
   * @param key 설정 키 경로 (점으로 구분, 예: 'core.logLevel')
   * @param defaultValue 기본값
   * @returns 설정 값 또는 기본값
   */
  get(key, defaultValue) {
    try {
      const parts = key.split(".");
      let current = this.config;
      for (const part of parts) {
        if (current === void 0 || current === null || current[part] === void 0) {
          return defaultValue;
        }
        current = current[part];
      }
      return current;
    } catch (error) {
      console.error(`\uC124\uC815 \uAC12 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328 (${key}):`, error);
      return defaultValue;
    }
  }
  /**
   * 환경 변수 확인 및 대체
   * @param value 환경 변수를 포함할 수 있는 문자열
   * @returns 환경 변수가 대체된 문자열
   */
  resolveEnvVars(value) {
    if (typeof value !== "string") {
      return value;
    }
    return value.replace(/\${([^}]+)}/g, (match, varName) => {
      const envValue = process.env[varName];
      return envValue !== void 0 ? envValue : match;
    });
  }
  /**
   * 설정 값 설정 (저장하지 않음)
   * @param key 설정 키 경로
   * @param value 설정 값
   */
  set(key, value) {
    const parts = key.split(".");
    const lastPart = parts.pop();
    if (!lastPart) {
      return;
    }
    let current = this.config;
    for (const part of parts) {
      if (current[part] === void 0) {
        current[part] = {};
      }
      current = current[part];
    }
    current[lastPart] = value;
  }
  /**
   * 설정 저장
   * @returns 저장 성공 여부
   */
  save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error("\uC124\uC815 \uC800\uC7A5 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return false;
    }
  }
  /**
   * 기본 스키마 로드
   */
  loadDefaultSchemas() {
    this.schemas.set("core", {
      type: "object",
      properties: {
        logLevel: {
          type: "string",
          enum: ["debug", "info", "warn", "error"]
        },
        sslBypass: {
          type: "boolean"
        },
        storagePath: {
          type: "string"
        },
        offlineMode: {
          type: "boolean"
        },
        embedDevMode: {
          type: "boolean",
          description: "\uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC \uD65C\uC131\uD654 \uC5EC\uBD80"
        }
      }
    });
    this.schemas.set("plugins", {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          enabled: {
            type: "boolean"
          },
          name: {
            type: "string"
          },
          description: {
            type: "string"
          },
          commands: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string"
                },
                description: {
                  type: "string"
                },
                syntax: {
                  type: "string"
                },
                examples: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
                api: {
                  type: "object",
                  properties: {
                    endpoint: {
                      type: "string"
                    },
                    method: {
                      type: "string",
                      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"]
                    },
                    headers: {
                      type: "object",
                      additionalProperties: {
                        type: "string"
                      }
                    },
                    body: {
                      type: "object"
                    }
                  },
                  required: ["endpoint", "method"]
                }
              },
              required: ["name", "description", "syntax"]
            }
          }
        },
        required: ["enabled", "name"]
      }
    });
  }
  /**
   * 설정 유효성 검증
   * @param config 검증할 설정 객체
   * @returns 유효성 여부
   */
  async validate(config) {
    try {
      if (!config || typeof config !== "object") {
        console.error("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC124\uC815 \uD615\uC2DD: \uAC1D\uCCB4\uAC00 \uC544\uB2D8");
        return false;
      }
      if (!config.core) {
        console.warn("\uCF54\uC5B4 \uC124\uC815 \uC139\uC158\uC774 \uC5C6\uC74C");
      }
      if (config.core && !this.validateSection(config.core, this.schemas.get("core"))) {
        console.error("\uCF54\uC5B4 \uC124\uC815 \uC720\uD6A8\uC131 \uAC80\uC99D \uC2E4\uD328");
        return false;
      }
      if (config.plugins && !this.validateSection(config.plugins, this.schemas.get("plugins"))) {
        console.error("\uD50C\uB7EC\uADF8\uC778 \uC124\uC815 \uC720\uD6A8\uC131 \uAC80\uC99D \uC2E4\uD328");
        return false;
      }
      return true;
    } catch (error) {
      console.error("\uC124\uC815 \uAC80\uC99D \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return false;
    }
  }
  /**
   * 설정 유효성 검증 
   * @returns 유효성 여부
   */
  async validateConfig() {
    try {
      if (Object.keys(this.config).length === 0) {
        console.warn("\uC124\uC815\uC774 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uBE48 \uAC1D\uCCB4\uB85C \uAC80\uC99D\uD569\uB2C8\uB2E4.");
        return this.validate({});
      }
      return this.validate(this.config);
    } catch (error) {
      console.error("\uC124\uC815 \uAC80\uC99D \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return false;
    }
  }
  /**
   * 설정 섹션 유효성 검증
   * 간단한 유효성 검사 수행 (실제로는 더 정교한 JSON 스키마 검증 라이브러리 사용 권장)
   * @param section 검증할 설정 섹션
   * @param schema JSON 스키마
   * @returns 유효성 여부
   */
  validateSection(section, schema) {
    try {
      if (schema.type === "object" && typeof section !== "object") {
        return false;
      }
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (section[key] !== void 0) {
            if (propSchema.type === "string" && typeof section[key] !== "string") {
              return false;
            } else if (propSchema.type === "boolean" && typeof section[key] !== "boolean") {
              return false;
            } else if (propSchema.type === "number" && typeof section[key] !== "number") {
              return false;
            } else if (propSchema.type === "array" && !Array.isArray(section[key])) {
              return false;
            } else if (propSchema.type === "object" && (typeof section[key] !== "object" || Array.isArray(section[key]))) {
              return false;
            }
            if (propSchema.enum && !propSchema.enum.includes(section[key])) {
              return false;
            }
          }
        }
      }
      if (schema.required) {
        for (const requiredProp of schema.required) {
          if (section[requiredProp] === void 0) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error("\uC124\uC815 \uC139\uC158 \uAC80\uC99D \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return false;
    }
  }
};

// src/core/llm/LlmService.ts
var vscode2 = __toESM(require("vscode"));

// src/core/env/EnvironmentService.ts
var EnvironmentService = class {
  constructor() {
    this.logger = new LoggerService("EnvironmentService");
    this.loadConfig();
  }
  static getInstance() {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }
  loadConfig() {
    try {
      try {
        this.config = require_extension_env();
      } catch (e) {
        this.config = {};
      }
    } catch (error) {
      this.logger.error("\uD658\uACBD \uC124\uC815 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD", error);
      this.config = {};
    }
  }
  getApiEndpoint(serviceName) {
    return this.config.API_ENDPOINTS?.[serviceName] || "";
  }
  getApiKey(keyName) {
    return this.config.API_KEYS?.[keyName] || "";
  }
  getDefaultModelId() {
    return this.config.DEFAULT_MODEL || "gemini-2.5-flash";
  }
  getAvailableModels() {
    return this.config.AVAILABLE_MODELS || [];
  }
  useMockData() {
    return this.config.USE_MOCK_DATA || false;
  }
  forceSslBypass() {
    return this.config.FORCE_SSL_BYPASS || false;
  }
  reload() {
    this.loadConfig();
  }
};
var environmentService = EnvironmentService.getInstance();

// src/core/utils/SSLBypassService.ts
var https = __toESM(require("https"));
var constants = __toESM(require("constants"));
var SSLBypassService = class {
  /**
   * 생성자
   */
  constructor() {
    /**
     * SSL 우회 활성화 상태
     */
    this.isBypassEnabled = false;
    this.isBypassEnabled = process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0";
  }
  /**
   * 싱글톤 인스턴스 가져오기
   * @returns SSLBypassService 인스턴스
   */
  static getInstance() {
    if (!SSLBypassService.instance) {
      SSLBypassService.instance = new SSLBypassService();
    }
    return SSLBypassService.instance;
  }
  /**
   * 전역 SSL 인증서 검증 우회 설정 적용
   * @returns 적용 성공 여부
   */
  applyGlobalBypass() {
    try {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      this.isBypassEnabled = true;
      console.log("SSL \uC778\uC99D\uC11C \uAC80\uC99D \uC6B0\uD68C\uAC00 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4 (\uC628\uD504\uB808\uBBF8\uC2A4 \uBAA8\uB4DC)");
      return true;
    } catch (error) {
      console.error("SSL \uC778\uC99D\uC11C \uAC80\uC99D \uC6B0\uD68C \uC124\uC815 \uC801\uC6A9 \uC624\uB958:", error);
      return false;
    }
  }
  /**
   * 요청별 SSL 우회 옵션 가져오기
   * @returns HTTPS 요청 옵션
   */
  getRequestOptions() {
    return {
      rejectUnauthorized: false,
      minVersion: "TLSv1",
      checkServerIdentity: () => void 0,
      secureOptions: constants.SSL_OP_NO_TLSv1_2
    };
  }
  /**
   * HTTPS 에이전트 생성
   * @returns SSL 우회 설정이 적용된 HTTPS 에이전트
   */
  createHttpsAgent() {
    return new https.Agent({
      rejectUnauthorized: false,
      minVersion: "TLSv1",
      checkServerIdentity: () => void 0,
      secureOptions: constants.SSL_OP_NO_TLSv1_2,
      ciphers: "ALL"
    });
  }
  /**
   * SSL 우회 상태 확인
   * @returns SSL 우회 활성화 여부
   */
  isBypassActive() {
    return this.isBypassEnabled;
  }
  /**
   * SSL 우회 설정 비활성화
   * @returns 비활성화 성공 여부
   */
  disableBypass() {
    try {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
      this.isBypassEnabled = false;
      console.log("SSL \uC778\uC99D\uC11C \uAC80\uC99D \uC6B0\uD68C\uAC00 \uBE44\uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4");
      return true;
    } catch (error) {
      console.error("SSL \uC778\uC99D\uC11C \uAC80\uC99D \uC6B0\uD68C \uC124\uC815 \uBE44\uD65C\uC131\uD654 \uC624\uB958:", error);
      return false;
    }
  }
};
var sslBypass = SSLBypassService.getInstance();

// src/core/http/HttpClientService.ts
var https2 = __toESM(require("https"));
var http = __toESM(require("http"));
var url = __toESM(require("url"));
var HttpClientService = class {
  /**
   * HTTP 요청 실행
   * @param options 요청 옵션
   * @returns HTTP 응답
   */
  async request(options) {
    try {
      const parsedUrl = url.parse(options.url);
      const isHttps = parsedUrl.protocol === "https:";
      const requestOptions = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: options.method,
        headers: options.headers || {}
      };
      if (isHttps && (options.bypassSsl || SSLBypassService.getInstance().isBypassActive())) {
        Object.assign(requestOptions, SSLBypassService.getInstance().getRequestOptions());
      }
      if (options.body && !requestOptions.headers["Content-Type"]) {
        requestOptions.headers["Content-Type"] = "application/json";
      }
      return new Promise((resolve, reject) => {
        const timeout = options.timeout || 3e4;
        const requestFn = isHttps ? https2.request : http.request;
        const req = requestFn(requestOptions, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
            if (options.onProgress) {
            }
          });
          res.on("end", () => {
            try {
              let parsedData = data;
              if (options.parseJson !== false) {
                try {
                  parsedData = JSON.parse(data);
                } catch (e) {
                  console.warn("JSON \uD30C\uC2F1 \uC2E4\uD328, \uC6D0\uC2DC \uB370\uC774\uD130 \uC0AC\uC6A9:", e);
                }
              }
              const response = {
                statusCode: res.statusCode || 0,
                statusText: res.statusMessage || "",
                headers: res.headers,
                data: parsedData,
                url: options.url,
                ok: res.statusCode !== void 0 && res.statusCode >= 200 && res.statusCode < 300
              };
              resolve(response);
            } catch (error) {
              reject(error);
            }
          });
        });
        req.on("error", (error) => {
          reject(error);
        });
        req.setTimeout(timeout, () => {
          req.destroy();
          reject(new Error(`\uC694\uCCAD \uC2DC\uAC04 \uCD08\uACFC (${timeout}ms): ${options.url}`));
        });
        if (options.body) {
          const bodyData = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
          req.write(bodyData);
        }
        req.end();
      });
    } catch (error) {
      console.error("HTTP \uC694\uCCAD \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      throw error;
    }
  }
  /**
   * GET 요청
   * @param url 요청 URL
   * @param headers 요청 헤더
   * @returns HTTP 응답
   */
  async get(url2, headers) {
    return this.request({
      url: url2,
      method: "GET" /* GET */,
      headers
    });
  }
  /**
   * POST 요청
   * @param url 요청 URL
   * @param body 요청 본문
   * @param headers 요청 헤더
   * @returns HTTP 응답
   */
  async post(url2, body, headers) {
    return this.request({
      url: url2,
      method: "POST" /* POST */,
      body,
      headers
    });
  }
  /**
   * PUT 요청
   * @param url 요청 URL
   * @param body 요청 본문
   * @param headers 요청 헤더
   * @returns HTTP 응답
   */
  async put(url2, body, headers) {
    return this.request({
      url: url2,
      method: "PUT" /* PUT */,
      body,
      headers
    });
  }
  /**
   * DELETE 요청
   * @param url 요청 URL
   * @param headers 요청 헤더
   * @returns HTTP 응답
   */
  async delete(url2, headers) {
    return this.request({
      url: url2,
      method: "DELETE" /* DELETE */,
      headers
    });
  }
  /**
   * SSL 우회 설정
   * @param bypass SSL 우회 여부
   */
  setSSLBypass(bypass) {
    if (bypass) {
      SSLBypassService.getInstance().applyGlobalBypass();
    } else {
      SSLBypassService.getInstance().disableBypass();
    }
  }
};

// src/core/llm/ApiClient.ts
var ApiClient = class {
  constructor(modelInfo) {
    this.modelInfo = modelInfo;
    this.logger = new LoggerService("ApiClient");
    this.httpClient = new HttpClientService();
    this.sslBypassService = new SSLBypassService();
    if (environmentService.forceSslBypass()) {
      this.sslBypassService.bypassSSLVerification();
    }
  }
  getApiEndpoint() {
    if (this.modelInfo.apiUrl) {
      return this.modelInfo.apiUrl;
    }
    switch (this.modelInfo.provider) {
      case "openrouter":
        return environmentService.getApiEndpoint("OPENROUTER_API");
      case "custom":
        return this.modelInfo.apiUrl || "";
      default:
        return environmentService.getApiEndpoint("NARRANS_API");
    }
  }
  getApiKey() {
    if (this.modelInfo.apiKey) {
      return this.modelInfo.apiKey;
    }
    switch (this.modelInfo.provider) {
      case "openrouter":
        return environmentService.getApiKey("OPENROUTER_API_KEY");
      case "custom":
        if (this.modelInfo.name?.toLowerCase().includes("narrans")) {
          return environmentService.getApiKey("NARRANS_API_KEY");
        } else if (this.modelInfo.name?.toLowerCase().includes("llama")) {
          return environmentService.getApiKey("LLAMA4_API_KEY");
        }
        return "";
      default:
        return environmentService.getApiKey("NARRANS_API_KEY");
    }
  }
  createHeaders() {
    const apiKey = this.getApiKey();
    const headers = {
      "Content-Type": "application/json"
    };
    if (apiKey) {
      if (this.modelInfo.provider === "openrouter") {
        headers["Authorization"] = `Bearer ${apiKey}`;
        headers["HTTP-Referer"] = "https://ape.samsungds.net";
        headers["X-Title"] = "APE - Agentic Pipeline Engine";
      } else {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
    }
    return headers;
  }
  createRequestBody(messages, systemPrompt) {
    const requestMessages = [...messages];
    if (systemPrompt && (messages.length === 0 || messages[0].role !== "system")) {
      requestMessages.unshift({
        role: "system",
        content: systemPrompt
      });
    }
    const requestBody = {
      messages: requestMessages,
      temperature: this.modelInfo.temperature || 0.7,
      max_tokens: this.modelInfo.maxTokens || 2048,
      stream: true
    };
    if (this.modelInfo.provider === "openrouter") {
      requestBody.model = this.modelInfo.apiModel || "google/gemini-2.5-flash-preview";
      requestBody.transforms = ["middle-out"];
    }
    if (this.modelInfo.topK)
      requestBody.top_k = this.modelInfo.topK;
    if (this.modelInfo.topP)
      requestBody.top_p = this.modelInfo.topP;
    if (this.modelInfo.presencePenalty)
      requestBody.presence_penalty = this.modelInfo.presencePenalty;
    if (this.modelInfo.frequencyPenalty)
      requestBody.frequency_penalty = this.modelInfo.frequencyPenalty;
    return requestBody;
  }
  async chatCompletion(request3) {
    try {
      if (environmentService.useMockData() || this.modelInfo.provider === "local") {
        return this.getMockResponse(request3);
      }
      const apiUrl = this.getApiEndpoint();
      if (!apiUrl) {
        throw new Error("API \uC5D4\uB4DC\uD3EC\uC778\uD2B8\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
      }
      const headers = this.createHeaders();
      const requestBody = this.createRequestBody(
        request3.messages,
        request3.systemPrompt || this.modelInfo.systemPrompt
      );
      const isStreaming = request3.stream !== void 0 ? request3.stream : true;
      if (isStreaming && request3.onUpdate) {
        return this.handleStreamingRequest(apiUrl, headers, requestBody, request3.onUpdate);
      } else {
        return this.handleNonStreamingRequest(apiUrl, headers, requestBody);
      }
    } catch (error) {
      this.logger.error("\uCC44\uD305 \uC644\uC131 \uC694\uCCAD \uC911 \uC624\uB958 \uBC1C\uC0DD", error);
      const errorResponse = {
        error: true,
        message: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
        code: error instanceof Error && "code" in error ? error.code : "UNKNOWN_ERROR"
      };
      return {
        error: errorResponse,
        content: "",
        model: this.modelInfo.id || "unknown",
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  }
  async handleStreamingRequest(apiUrl, headers, requestBody, onUpdate) {
    return new Promise(async (resolve, reject) => {
      try {
        let fullContent = "";
        const response = await this.httpClient.post(
          apiUrl,
          requestBody,
          {
            headers,
            responseType: "stream"
          }
        );
        for await (const chunk of response.data) {
          try {
            const chunkStr = chunk.toString();
            const lines = chunkStr.split("\n").filter(Boolean);
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6);
                if (jsonStr === "[DONE]") {
                  break;
                }
                try {
                  const json = JSON.parse(jsonStr);
                  const content = json.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullContent += content;
                    onUpdate(fullContent);
                  }
                } catch (e) {
                }
              }
            }
          } catch (e) {
          }
        }
        resolve({
          content: fullContent,
          model: this.modelInfo.id || "unknown",
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  async handleNonStreamingRequest(apiUrl, headers, requestBody) {
    requestBody.stream = false;
    const response = await this.httpClient.post(apiUrl, requestBody, { headers });
    const responseData = response.data;
    return {
      content: responseData.choices?.[0]?.message?.content || "",
      model: responseData.model || this.modelInfo.id || "unknown",
      usage: responseData.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }
  getMockResponse(request3) {
    return new Promise((resolve) => {
      const lastMessage = request3.messages[request3.messages.length - 1];
      const query = lastMessage.content;
      let mockResponse = "\uC774\uAC83\uC740 Mock \uC751\uB2F5\uC785\uB2C8\uB2E4.";
      if (request3.onUpdate) {
        request3.onUpdate(mockResponse);
      }
      resolve({
        content: mockResponse,
        model: `mock-${this.modelInfo.id || "model"}`,
        usage: {
          prompt_tokens: query.length / 4,
          completion_tokens: mockResponse.length / 4,
          total_tokens: (query.length + mockResponse.length) / 4
        }
      });
    });
  }
};

// src/core/llm/LlmService.ts
var LlmService = class {
  constructor() {
    this.modelCache = /* @__PURE__ */ new Map();
    this.logger = new LoggerService("LlmService");
    this.loadAvailableModels();
    this.defaultModelId = this.getDefaultModelId();
  }
  loadAvailableModels() {
    try {
      const models = environmentService.getAvailableModels();
      this.modelCache.clear();
      for (const model of models) {
        this.modelCache.set(model.id, model);
      }
      if (this.modelCache.size === 0) {
        const fallbackModels = this.getFallbackModels();
        for (const model of fallbackModels) {
          this.modelCache.set(model.id, model);
        }
      }
    } catch (error) {
      this.logger.error("\uBAA8\uB378 \uBAA9\uB85D \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD", error);
      const fallbackModels = this.getFallbackModels();
      for (const model of fallbackModels) {
        this.modelCache.set(model.id, model);
      }
    }
  }
  getFallbackModels() {
    return [
      {
        id: "local-fallback",
        name: "\uB85C\uCEEC \uC2DC\uBBAC\uB808\uC774\uC158 (\uC624\uD504\uB77C\uC778)",
        provider: "local",
        temperature: 0.7
      }
    ];
  }
  async sendRequest(options) {
    if (!options) {
      throw new Error("\uC694\uCCAD \uC635\uC158\uC774 \uC81C\uACF5\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
    }
    const {
      model = this.getDefaultModelId(),
      messages = [],
      temperature,
      maxTokens,
      stream,
      onUpdate
    } = options;
    if (!Array.isArray(messages)) {
      throw new Error("\uC694\uCCAD \uBA54\uC2DC\uC9C0\uAC00 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    }
    const finalMessages = messages.length === 0 ? [{
      role: "user",
      content: "\uC548\uB155\uD558\uC138\uC694"
    }] : messages;
    const modelId = String(model || this.getDefaultModelId());
    let modelConfig = this.getModelConfig(modelId);
    if (!modelConfig) {
      return this.simulateLocalModel(finalMessages);
    }
    if (modelConfig.systemPrompt && !finalMessages.some((m) => m.role === "system")) {
      finalMessages.unshift({
        role: "system",
        content: modelConfig.systemPrompt
      });
    }
    try {
      const apiClient = new ApiClient(modelConfig);
      if (stream && onUpdate) {
        const result2 = await apiClient.chatCompletion({
          messages: finalMessages,
          modelId: modelConfig.id,
          systemPrompt: modelConfig.systemPrompt,
          temperature: temperature || modelConfig.temperature,
          maxTokens: maxTokens || modelConfig.maxTokens,
          stream: true,
          onUpdate
        });
        return {
          content: result2.content,
          model: modelConfig.id,
          raw: result2
        };
      }
      const result = await apiClient.chatCompletion({
        messages: finalMessages,
        modelId: modelConfig.id,
        systemPrompt: modelConfig.systemPrompt,
        temperature: temperature || modelConfig.temperature,
        maxTokens: maxTokens || modelConfig.maxTokens,
        stream: false
      });
      return {
        content: result.content,
        model: modelConfig.id,
        raw: result
      };
    } catch (error) {
      this.logger.error("LlmService: \uC694\uCCAD \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      const isApiKeyError = (err) => {
        return err instanceof Error && "code" in err && err.code !== void 0 && (err.code === "missing_api_key" || err.code === "invalid_api_key");
      };
      if (isApiKeyError(error)) {
        return this.simulateLocalModel(finalMessages);
      }
      return this.simulateLocalModel(finalMessages);
    }
  }
  async queryLlm(text, model, options) {
    if (!text) {
      return "\uCFFC\uB9AC \uD14D\uC2A4\uD2B8\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.";
    }
    try {
      const requestOptions = {
        model: model || this.getDefaultModelId(),
        messages: [{
          role: "user",
          content: text
        }],
        ...options
      };
      const response = await this.sendRequest(requestOptions);
      return response.content;
    } catch (error) {
      return `\uCFFC\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`;
    }
  }
  async simulateLocalModel(messages) {
    const localModelConfig = {
      id: "local-fallback",
      name: "\uB85C\uCEEC \uC2DC\uBBAC\uB808\uC774\uC158 (\uC624\uD504\uB77C\uC778)",
      provider: "local",
      temperature: 0.7
    };
    const lastMessage = messages[messages.length - 1];
    const mockResponse = "\uC774\uAC83\uC740 \uB85C\uCEEC \uC2DC\uBBAC\uB808\uC774\uC158 \uC751\uB2F5\uC785\uB2C8\uB2E4.";
    return {
      content: mockResponse,
      model: localModelConfig.id,
      raw: {
        content: mockResponse,
        model: localModelConfig.id,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      }
    };
  }
  getDefaultModelId() {
    return environmentService.getDefaultModelId();
  }
  async setDefaultModel(modelId) {
    try {
      if (!modelId || typeof modelId !== "string") {
        return false;
      }
      const modelConfig = this.getModelConfig(modelId);
      if (!modelConfig) {
        return false;
      }
      try {
        const config = vscode2.workspace.getConfiguration("ape.llm");
        await config.update("defaultModel", modelId, vscode2.ConfigurationTarget.Global);
        return true;
      } catch (updateError) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  getAvailableModels() {
    return Array.from(this.modelCache.values());
  }
  getModelConfig(modelId) {
    if (modelId === void 0) {
      return this.getAvailableModels();
    }
    return this.modelCache.get(modelId);
  }
};

// src/core/vscode/VSCodeService.ts
var vscode3 = __toESM(require("vscode"));
var VSCodeService = class {
  constructor(context) {
    this._extensionContext = context;
  }
  /**
   * 전역 상태에서 값을 가져옵니다.
   * @param key 상태 키
   * @param defaultValue 기본값
   * @returns 상태 값
   */
  getGlobalState(key, defaultValue) {
    return this._extensionContext.globalState.get(key, defaultValue);
  }
  /**
   * 전역 상태에 값을 저장합니다.
   * @param key 상태 키
   * @param value 저장할 값
   * @returns Promise
   */
  async setGlobalState(key, value) {
    await this._extensionContext.globalState.update(key, value);
  }
  /**
   * 작업 영역 상태에서 값을 가져옵니다.
   * @param key 상태 키
   * @param defaultValue 기본값
   * @returns 상태 값
   */
  getWorkspaceState(key, value) {
    return this._extensionContext.workspaceState.get(key, value);
  }
  /**
   * 작업 영역 상태에 값을 저장합니다.
   * @param key 상태 키
   * @param value 저장할 값
   * @returns Promise
   */
  async setWorkspaceState(key, value) {
    await this._extensionContext.workspaceState.update(key, value);
  }
  /**
   * 현재 열린 텍스트 편집기를 가져옵니다.
   * @returns 활성 텍스트 편집기 또는 undefined
   */
  getActiveTextEditor() {
    return vscode3.window.activeTextEditor;
  }
  /**
   * 현재 선택된 텍스트를 가져옵니다.
   * @returns 선택된 텍스트 또는 빈 문자열
   */
  getSelectedText() {
    const editor = this.getActiveTextEditor();
    if (!editor)
      return "";
    return editor.document.getText(editor.selection);
  }
  /**
   * 텍스트 편집기에 텍스트를 삽입합니다.
   * @param text 삽입할 텍스트
   * @param position 삽입 위치 (선택 사항)
   * @returns 성공 여부
   */
  async insertText(text, position) {
    const editor = this.getActiveTextEditor();
    if (!editor)
      return false;
    try {
      await editor.edit((editBuilder) => {
        if (position) {
          editBuilder.insert(position, text);
        } else {
          const selections = editor.selections;
          selections.forEach((selection) => {
            editBuilder.replace(selection, text);
          });
        }
      });
      return true;
    } catch (error) {
      console.error("\uD14D\uC2A4\uD2B8 \uC0BD\uC785 \uC624\uB958:", error);
      return false;
    }
  }
  /**
   * 명령어를 등록합니다.
   * @param command 명령어 ID
   * @param callback 콜백 함수
   * @returns Disposable
   */
  registerCommand(command, callback) {
    return vscode3.commands.registerCommand(command, callback);
  }
  /**
   * 텍스트 문서 내용 변경 이벤트를 등록합니다.
   * @param callback 콜백 함수
   * @returns Disposable
   */
  onDidChangeTextDocument(callback) {
    return vscode3.workspace.onDidChangeTextDocument(callback);
  }
  /**
   * 활성 편집기 변경 이벤트를 등록합니다.
   * @param callback 콜백 함수
   * @returns Disposable
   */
  onDidChangeActiveTextEditor(callback) {
    return vscode3.window.onDidChangeActiveTextEditor(callback);
  }
  /**
   * 정보 메시지를 표시합니다.
   * @param message 메시지 내용
   * @returns void
   */
  showInformationMessage(message) {
    return vscode3.window.showInformationMessage(message);
  }
  /**
   * 경고 메시지를 표시합니다.
   * @param message 메시지 내용
   * @returns void
   */
  showWarningMessage(message) {
    return vscode3.window.showWarningMessage(message);
  }
  /**
   * 오류 메시지를 표시합니다.
   * @param message 메시지 내용
   * @returns void
   */
  showErrorMessage(message) {
    return vscode3.window.showErrorMessage(message);
  }
  /**
   * 진행 상태를 보여주는 함수입니다.
   * @param title 진행 상태 제목
   * @param task 진행할 작업 함수
   * @returns Task 결과
   */
  async withProgress(title, task) {
    return vscode3.window.withProgress(
      {
        location: vscode3.ProgressLocation.Notification,
        title,
        cancellable: false
      },
      task
    );
  }
  /**
   * 확장 프로그램 컨텍스트를 반환합니다.
   * @returns 확장 프로그램 컨텍스트
   */
  getExtensionContext() {
    return this._extensionContext;
  }
  /**
   * VS Code 확장 URI를 반환합니다.
   * @returns 확장 URI
   */
  getExtensionUri() {
    return this._extensionContext.extensionUri;
  }
  /**
   * 현재 편집기 컨텍스트 정보를 수집합니다.
   * 활성 파일, 선택된 텍스트, 프로젝트 정보 등을 포함합니다.
   * @returns 편집기 컨텍스트 정보
   */
  async getEditorContext() {
    try {
      const editor = this.getActiveTextEditor();
      const activeFilePath = editor?.document.uri.fsPath;
      const selectedText = this.getSelectedText();
      const activeFileContent = editor ? editor.document.getText() : "";
      const workspaceFolders = vscode3.workspace.workspaceFolders || [];
      const workspaceInfo = workspaceFolders.map((folder) => ({
        name: folder.name,
        path: folder.uri.fsPath
      }));
      const config = vscode3.workspace.getConfiguration("ape");
      const languageId = editor?.document.languageId;
      const cursorPosition = editor?.selection.active;
      const line = cursorPosition ? editor.document.lineAt(cursorPosition.line).text : "";
      const editorContext = {
        activeFile: {
          path: activeFilePath,
          language: languageId,
          selection: selectedText,
          cursorPosition: cursorPosition ? {
            line: cursorPosition.line,
            character: cursorPosition.character
          } : null,
          currentLine: line
        },
        workspace: {
          folders: workspaceInfo,
          name: workspaceFolders.length > 0 ? workspaceFolders[0].name : "No Workspace"
        },
        config: {
          settings: {
            llm: config.get("llm"),
            plugins: config.get("plugins")
          }
        }
      };
      return editorContext;
    } catch (error) {
      console.error("\uD3B8\uC9D1\uAE30 \uCEE8\uD14D\uC2A4\uD2B8 \uC218\uC9D1 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return {
        error: "Failed to collect editor context",
        activeFile: null,
        workspace: null
      };
    }
  }
};

// src/core/prompt/PromptAssemblerService.ts
var PromptAssemblerService = class {
  /**
   * PromptAssemblerService 생성자
   * @param configLoader 설정 로더
   * @param rulesEngine 규칙 엔진
   */
  constructor(configLoader, rulesEngine) {
    this.configLoader = configLoader;
    this.rulesEngine = rulesEngine;
    /**
     * 템플릿 맵
     */
    this.templates = /* @__PURE__ */ new Map();
    /**
     * 기본 시스템 프롬프트
     */
    this.defaultSystemPrompt = `
    \uB2F9\uC2E0\uC740 Ape\uC774\uB77C\uB294 \uAC1C\uBC1C \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uD5C8\uBE0C\uC5D0 \uD1B5\uD569\uB41C AI \uC5B4\uC2DC\uC2A4\uD134\uD2B8\uC785\uB2C8\uB2E4.
    \uAC1C\uBC1C\uC790\uB4E4\uC5D0\uAC8C \uCF54\uB4DC \uC791\uC131, \uBC84\uADF8 \uD574\uACB0, \uBB38\uC11C\uD654 \uB4F1 \uB2E4\uC591\uD55C \uAC1C\uBC1C \uC791\uC5C5\uC744 \uC9C0\uC6D0\uD569\uB2C8\uB2E4.
    \uC628\uD504\uB808\uBBF8\uC2A4 \uD658\uACBD\uC5D0\uC11C \uC2E4\uD589\uB418\uBA70, \uBCF4\uC548\uACFC \uC131\uB2A5\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.
    \uBA85\uD655\uD558\uACE0 \uC815\uD655\uD55C \uB2F5\uBCC0\uC744 \uC81C\uACF5\uD558\uB418, \uD544\uC694 \uC2DC \uCD94\uAC00 \uC815\uBCF4\uB97C \uC694\uCCAD\uD558\uC138\uC694.
  `.trim();
    this.registerDefaultTemplates();
  }
  /**
   * 기본 템플릿 등록
   */
  registerDefaultTemplates() {
    this.registerTemplate({
      id: "default_system",
      type: "system" /* SYSTEM */,
      content: this.defaultSystemPrompt,
      description: "\uAE30\uBCF8 \uC2DC\uC2A4\uD15C \uD504\uB86C\uD504\uD2B8"
    });
    this.registerTemplate({
      id: "code_generation",
      type: "user" /* USER */,
      content: `
        \uB2E4\uC74C \uC870\uAC74\uC73C\uB85C \uCF54\uB4DC\uB97C \uC0DD\uC131\uD574\uC8FC\uC138\uC694:
        
        \uC5B8\uC5B4: {{languageId}}
        \uD30C\uC77C: {{filePath}}
        \uC694\uCCAD: {{input}}
        
        \uCF54\uB4DC\uB9CC \uC0DD\uC131\uD558\uACE0 \uCD94\uAC00 \uC124\uBA85\uC740 \uC791\uC131\uD558\uC9C0 \uB9C8\uC138\uC694.
      `.trim(),
      description: "\uCF54\uB4DC \uC0DD\uC131 \uD504\uB86C\uD504\uD2B8",
      tags: ["code", "generation"]
    });
    this.registerTemplate({
      id: "code_refactoring",
      type: "user" /* USER */,
      content: `
        \uB2E4\uC74C \uCF54\uB4DC\uB97C \uB9AC\uD329\uD1A0\uB9C1\uD574\uC8FC\uC138\uC694:
        
        \`\`\`{{languageId}}
        {{selectedCode}}
        \`\`\`
        
        \uC694\uCCAD: {{input}}
        
        \uB354 \uD6A8\uC728\uC801\uC774\uACE0 \uAC00\uB3C5\uC131 \uB192\uC740 \uCF54\uB4DC\uB85C \uBCC0\uACBD\uD574\uC8FC\uC138\uC694.
        \uB9AC\uD329\uD1A0\uB9C1\uB41C \uCF54\uB4DC\uB9CC \uC81C\uACF5\uD558\uACE0 \uCD94\uAC00 \uC124\uBA85\uC740 \uC791\uC131\uD558\uC9C0 \uB9C8\uC138\uC694.
      `.trim(),
      description: "\uCF54\uB4DC \uB9AC\uD329\uD1A0\uB9C1 \uD504\uB86C\uD504\uD2B8",
      tags: ["code", "refactoring"]
    });
    this.registerTemplate({
      id: "bug_fixing",
      type: "user" /* USER */,
      content: `
        \uB2E4\uC74C \uCF54\uB4DC\uC758 \uBC84\uADF8\uB97C \uD574\uACB0\uD574\uC8FC\uC138\uC694:
        
        \`\`\`{{languageId}}
        {{selectedCode}}
        \`\`\`
        
        \uC624\uB958 \uB0B4\uC6A9: {{input}}
        
        \uC218\uC815\uB41C \uCF54\uB4DC\uB97C \uC81C\uACF5\uD558\uACE0 \uBCC0\uACBD \uC0AC\uD56D\uC5D0 \uB300\uD574 \uAC04\uB7B5\uD788 \uC124\uBA85\uD574\uC8FC\uC138\uC694.
      `.trim(),
      description: "\uBC84\uADF8 \uD574\uACB0 \uD504\uB86C\uD504\uD2B8",
      tags: ["code", "bug", "fixing"]
    });
  }
  /**
   * 템플릿 등록
   * @param template 프롬프트 템플릿
   * @returns 등록 성공 여부
   */
  registerTemplate(template) {
    try {
      this.templates.set(template.id, template);
      return true;
    } catch (error) {
      console.error(`\uD15C\uD50C\uB9BF \uB4F1\uB85D \uC2E4\uD328 (${template.id}):`, error);
      return false;
    }
  }
  /**
   * 템플릿 가져오기
   * @param templateId 템플릿 ID
   * @returns 템플릿 또는 undefined
   */
  getTemplate(templateId) {
    return this.templates.get(templateId);
  }
  /**
   * 변수 치환
   * @param template 템플릿 문자열
   * @param context 컨텍스트
   * @returns 치환된 문자열
   */
  replaceVariables(template, context) {
    if (!template) {
      return "";
    }
    return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      if (context[varName] !== void 0) {
        return String(context[varName] || "");
      }
      if (context.variables && context.variables[varName] !== void 0) {
        return String(context.variables[varName] || "");
      }
      return match;
    });
  }
  /**
   * 프롬프트 생성
   * @param basePrompt 기본 프롬프트
   * @param context 컨텍스트
   * @returns 완성된 프롬프트
   */
  /**
   * 텍스트를 기반으로 프롬프트 데이터 생성
   */
  async assemblePrompt(text) {
    try {
      const messages = [
        {
          role: "system",
          content: this.defaultSystemPrompt
        },
        {
          role: "user",
          content: text
        }
      ];
      const temperature = 0.7;
      return {
        messages,
        temperature
      };
    } catch (error) {
      console.error("\uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return {
        messages: [
          {
            role: "user",
            content: text || "\uC548\uB155\uD558\uC138\uC694"
          }
        ],
        temperature: 0.7
      };
    }
  }
  /**
   * 기존 메서드 (이전 버전과의 호환성을 위해 유지)
   */
  assemblePromptLegacy(basePrompt, context) {
    try {
      const prompt = this.replaceVariables(basePrompt, context);
      return this.enhancePrompt(prompt, context);
    } catch (error) {
      console.error("\uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return basePrompt;
    }
  }
  /**
   * 템플릿 ID로 프롬프트 생성
   * @param templateId 템플릿 ID
   * @param context 컨텍스트
   * @returns 완성된 프롬프트
   */
  assembleFromTemplate(templateId, context) {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        console.warn(`\uD15C\uD50C\uB9BF\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${templateId}`);
        return "";
      }
      return this.assemblePrompt(template.content, context);
    } catch (error) {
      console.error(`\uD15C\uD50C\uB9BF \uAE30\uBC18 \uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD (${templateId}):`, error);
      return "";
    }
  }
  /**
   * 규칙 기반 프롬프트 생성
   * @param context 컨텍스트
   * @returns 규칙 기반 프롬프트 목록
   */
  assembleFromRules(context) {
    try {
      const rules = this.rulesEngine.getApplicableRules(context);
      return rules.map((rule) => {
        const template = this.getTemplate(rule.templateId);
        if (!template) {
          console.warn(`\uADDC\uCE59 ${rule.id}\uC5D0 \uB300\uD55C \uD15C\uD50C\uB9BF\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${rule.templateId}`);
          return "";
        }
        return this.assemblePrompt(template.content, context);
      }).filter((prompt) => prompt !== "");
    } catch (error) {
      console.error("\uADDC\uCE59 \uAE30\uBC18 \uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return [];
    }
  }
  /**
   * 프롬프트 개선
   * @param prompt 기본 프롬프트
   * @param context 컨텍스트
   * @returns 개선된 프롬프트
   */
  enhancePrompt(prompt, context) {
    return prompt;
  }
};

// src/core/prompt/RulesEngineService.ts
var RulesEngineService = class {
  /**
   * RulesEngineService 생성자
   * @param configLoader 설정 로더
   */
  constructor(configLoader) {
    this.configLoader = configLoader;
    /**
     * 규칙 목록
     */
    this.rules = [];
    this.registerDefaultRules();
  }
  /**
   * 기본 규칙 등록
   */
  registerDefaultRules() {
    this.registerRule({
      id: "code_generation_rule",
      name: "\uCF54\uB4DC \uC0DD\uC131 \uADDC\uCE59",
      priority: 100,
      conditions: [
        {
          field: "input",
          operator: "contains",
          value: "\uC0DD\uC131"
        },
        {
          field: "languageId",
          operator: "exists",
          value: true
        }
      ],
      templateId: "code_generation",
      tags: ["code", "generation"]
    });
    this.registerRule({
      id: "code_refactoring_rule",
      name: "\uCF54\uB4DC \uB9AC\uD329\uD1A0\uB9C1 \uADDC\uCE59",
      priority: 90,
      conditions: [
        {
          field: "input",
          operator: "contains",
          value: "\uB9AC\uD329\uD1A0\uB9C1"
        },
        {
          field: "selectedCode",
          operator: "exists",
          value: true
        }
      ],
      templateId: "code_refactoring",
      tags: ["code", "refactoring"]
    });
    this.registerRule({
      id: "bug_fixing_rule",
      name: "\uBC84\uADF8 \uD574\uACB0 \uADDC\uCE59",
      priority: 80,
      conditions: [
        {
          field: "input",
          operator: "contains",
          value: "\uBC84\uADF8"
        },
        {
          field: "selectedCode",
          operator: "exists",
          value: true
        }
      ],
      templateId: "bug_fixing",
      tags: ["code", "bug", "fixing"]
    });
  }
  /**
   * 규칙 등록
   * @param rule 규칙
   * @returns 등록 성공 여부
   */
  registerRule(rule) {
    try {
      const existingRuleIndex = this.rules.findIndex((r) => r.id === rule.id);
      if (existingRuleIndex >= 0) {
        this.rules[existingRuleIndex] = rule;
      } else {
        this.rules.push(rule);
      }
      this.rules.sort((a, b) => b.priority - a.priority);
      return true;
    } catch (error) {
      console.error(`\uADDC\uCE59 \uB4F1\uB85D \uC2E4\uD328 (${rule.id}):`, error);
      return false;
    }
  }
  /**
   * 컨텍스트에 적용 가능한 규칙 조회
   * @param context 컨텍스트
   * @returns 적용 가능한 규칙 목록
   */
  getApplicableRules(context) {
    try {
      return this.rules.filter((rule) => {
        return rule.conditions.every((condition) => this.evaluateCondition(condition, context));
      });
    } catch (error) {
      console.error("\uC801\uC6A9 \uAC00\uB2A5\uD55C \uADDC\uCE59 \uC870\uD68C \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return [];
    }
  }
  /**
   * 규칙 조건 평가
   * @param condition 조건
   * @param context 컨텍스트
   * @returns 조건 만족 여부
   */
  evaluateCondition(condition, context) {
    try {
      let fieldValue;
      if (condition.field.includes(".")) {
        const parts = condition.field.split(".");
        let current = context;
        for (const part of parts) {
          if (current === void 0 || current === null) {
            return false;
          }
          current = current[part];
        }
        fieldValue = current;
      } else {
        fieldValue = context[condition.field];
      }
      switch (condition.operator) {
        case "equals":
          return fieldValue === condition.value;
        case "notEquals":
          return fieldValue !== condition.value;
        case "contains":
          if (typeof fieldValue !== "string") {
            return false;
          }
          return fieldValue.toLowerCase().includes(
            typeof condition.value === "string" ? condition.value.toLowerCase() : String(condition.value)
          );
        case "startsWith":
          if (typeof fieldValue !== "string") {
            return false;
          }
          return fieldValue.toLowerCase().startsWith(
            typeof condition.value === "string" ? condition.value.toLowerCase() : String(condition.value)
          );
        case "endsWith":
          if (typeof fieldValue !== "string") {
            return false;
          }
          return fieldValue.toLowerCase().endsWith(
            typeof condition.value === "string" ? condition.value.toLowerCase() : String(condition.value)
          );
        case "regex":
          if (typeof fieldValue !== "string") {
            return false;
          }
          return new RegExp(condition.value).test(fieldValue);
        case "exists":
          return condition.value ? fieldValue !== void 0 && fieldValue !== null : fieldValue === void 0 || fieldValue === null;
        default:
          console.warn(`\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC870\uAC74 \uC5F0\uC0B0\uC790: ${condition.operator}`);
          return false;
      }
    } catch (error) {
      console.error(`\uC870\uAC74 \uD3C9\uAC00 \uC911 \uC624\uB958 \uBC1C\uC0DD:`, error);
      return false;
    }
  }
};

// src/core/domain/SwdpDomainService.ts
var import_events5 = require("events");

// src/plugins/internal/swdp/SwdpClientService.ts
var SwdpClientService = class {
  /**
   * SwdpClientService 생성자
   * @param baseUrl APE Core 엔드포인트 기본 URL (기본값: http://localhost:8080)
   * @param bypassSsl SSL 인증서 검증 우회 여부
   */
  constructor(baseUrl = "http://localhost:8080", bypassSsl = true) {
    /**
     * 인증 헤더
     */
    this.authHeaders = {};
    /**
     * 초기화 완료 여부
     */
    this.initialized = false;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    this.httpClient = new HttpClientService();
    if (bypassSsl) {
      this.httpClient.setSSLBypass(true);
    }
  }
  /**
   * 클라이언트 초기화
   * @param credentials 인증 정보
   */
  async initialize(credentials) {
    try {
      this.authHeaders = {
        "Content-Type": "application/json"
      };
      if (credentials.userId) {
        this.authHeaders["User-ID"] = credentials.userId;
      }
      if (credentials.token) {
        this.authHeaders["Authorization"] = `Bearer ${credentials.token}`;
      }
      if (credentials.gitUsername) {
        this.authHeaders["Git-Username"] = credentials.gitUsername;
      }
      if (credentials.gitEmail) {
        this.authHeaders["Git-Email"] = credentials.gitEmail;
      }
      await this.testConnection();
      this.initialized = true;
      console.log("SWDP \uD074\uB77C\uC774\uC5B8\uD2B8 \uCD08\uAE30\uD654 \uC644\uB8CC");
    } catch (error) {
      console.error("SWDP \uD074\uB77C\uC774\uC5B8\uD2B8 \uCD08\uAE30\uD654 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      throw error;
    }
  }
  /**
   * 연결 테스트
   */
  async testConnection() {
    try {
      const response = await this.httpClient.get(
        `${this.baseUrl}api/status`,
        this.authHeaders
      );
      if (!response.ok) {
        throw new Error(`APE Core \uC5F0\uACB0 \uD14C\uC2A4\uD2B8 \uC2E4\uD328: ${response.statusCode} ${response.statusText}`);
      }
      console.log("APE Core \uC5F0\uACB0 \uD14C\uC2A4\uD2B8 \uC131\uACF5:", response.data.status);
    } catch (error) {
      console.error("APE Core \uC5F0\uACB0 \uD14C\uC2A4\uD2B8 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      throw error;
    }
  }
  /**
   * 초기화 확인
   */
  checkInitialized() {
    if (!this.initialized) {
      throw new Error("SWDP \uD074\uB77C\uC774\uC5B8\uD2B8\uAC00 \uCD08\uAE30\uD654\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
  }
  /**
   * SWDP Agent에 명령 전송
   * @param route API 라우트
   * @param data 요청 데이터
   * @returns 응답 데이터
   */
  async sendSwdpCommand(route, data) {
    this.checkInitialized();
    try {
      const apiUrl = `${this.baseUrl}api/swdp/${route}`;
      const requestData = {
        ...data,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const response = await this.httpClient.post(
        apiUrl,
        requestData,
        this.authHeaders
      );
      if (!response.ok) {
        throw new Error(`SWDP \uC694\uCCAD \uC2E4\uD328 (${route}): ${response.statusCode} ${response.statusText}`);
      }
      return response.data;
    } catch (error) {
      console.error(`SWDP \uC694\uCCAD \uC911 \uC624\uB958 \uBC1C\uC0DD (${route}):`, error);
      throw error;
    }
  }
  /**
   * SWDP 빌드 시작
   * @param options 빌드 옵션
   * @returns 빌드 결과
   */
  async startBuild(options) {
    return this.sendSwdpCommand("builds/start", {
      type: options.type,
      watchMode: options.watchMode || false,
      createPr: options.createPr || false,
      params: options.params || {}
    });
  }
  /**
   * 빌드 상태 조회
   * @param buildId 빌드 ID (생략 시 최근 빌드)
   * @returns 빌드 상태
   */
  async getBuildStatus(buildId) {
    return this.sendSwdpCommand("builds/status", {
      buildId
    });
  }
  /**
   * 빌드 로그 조회
   * @param buildId 빌드 ID
   * @returns 빌드 로그
   */
  async getBuildLogs(buildId) {
    return this.sendSwdpCommand("builds/logs", {
      buildId
    });
  }
  /**
   * 빌드 취소
   * @param buildId 빌드 ID
   * @returns 취소 결과
   */
  async cancelBuild(buildId) {
    return this.sendSwdpCommand("builds/cancel", {
      buildId
    });
  }
  /**
   * 테스트 실행
   * @param options 테스트 옵션
   * @returns 테스트 결과
   */
  async runTest(options) {
    return this.sendSwdpCommand("tests/run", {
      type: options.type,
      target: options.target,
      params: options.params || {}
    });
  }
  /**
   * 테스트 결과 조회
   * @param testId 테스트 ID
   * @returns 테스트 결과
   */
  async getTestResults(testId) {
    return this.sendSwdpCommand("tests/results", {
      testId
    });
  }
  /**
   * TR(Test Request) 생성
   * @param options TR 옵션
   * @returns TR 정보
   */
  async createTR(options) {
    return this.sendSwdpCommand("tr/create", {
      title: options.title,
      description: options.description,
      type: options.type,
      priority: options.priority || "medium",
      assignee: options.assignee
    });
  }
  /**
   * TR 상태 조회
   * @param trId TR ID
   * @returns TR 상태
   */
  async getTRStatus(trId) {
    return this.sendSwdpCommand("tr/status", {
      trId
    });
  }
  /**
   * 배포 시작
   * @param environment 배포 환경
   * @param buildId 빌드 ID
   * @param params 배포 파라미터
   * @returns 배포 결과
   */
  async startDeployment(environment, buildId, params) {
    return this.sendSwdpCommand("deployments/start", {
      environment,
      buildId,
      params: params || {}
    });
  }
  /**
   * 배포 상태 조회
   * @param deploymentId 배포 ID
   * @returns 배포 상태
   */
  async getDeploymentStatus(deploymentId) {
    return this.sendSwdpCommand("deployments/status", {
      deploymentId
    });
  }
  /**
   * 프로젝트 목록 조회
   * @returns 프로젝트 목록
   */
  async getProjects() {
    return this.sendSwdpCommand("projects/list", {});
  }
  /**
   * 프로젝트 세부 정보 조회
   * @param projectCode 프로젝트 코드
   * @returns 프로젝트 세부 정보
   */
  async getProjectDetails(projectCode) {
    return this.sendSwdpCommand("projects/details", {
      projectCode
    });
  }
  /**
   * 현재 작업 프로젝트 설정
   * @param projectCode 프로젝트 코드
   * @returns 설정 결과
   */
  async setCurrentProject(projectCode) {
    return this.sendSwdpCommand("projects/set-current", {
      projectCode
    });
  }
  /**
   * 작업 목록 조회
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @returns 작업 목록
   */
  async getTasks(projectCode) {
    return this.sendSwdpCommand("tasks/list", {
      projectCode
    });
  }
  /**
   * 작업 세부 정보 조회
   * @param taskId 작업 ID
   * @returns 작업 세부 정보
   */
  async getTaskDetails(taskId) {
    return this.sendSwdpCommand("tasks/details", {
      taskId
    });
  }
  /**
   * 작업 생성
   * @param title 작업 제목
   * @param description 작업 설명
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @param params 추가 파라미터
   * @returns 생성된 작업 정보
   */
  async createTask(title, description, projectCode, params) {
    return this.sendSwdpCommand("tasks/create", {
      title,
      description,
      projectCode,
      params: params || {}
    });
  }
  /**
   * 작업 상태 업데이트
   * @param taskId 작업 ID
   * @param status 새 상태
   * @returns 업데이트 결과
   */
  async updateTaskStatus(taskId, status) {
    return this.sendSwdpCommand("tasks/update-status", {
      taskId,
      status
    });
  }
  /**
   * 문서 목록 조회
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @returns 문서 목록
   */
  async getDocuments(projectCode) {
    return this.sendSwdpCommand("documents/list", {
      projectCode
    });
  }
  /**
   * 문서 세부 정보 조회
   * @param docId 문서 ID
   * @returns 문서 세부 정보
   */
  async getDocumentDetails(docId) {
    return this.sendSwdpCommand("documents/details", {
      docId
    });
  }
  /**
   * 문서 생성
   * @param title 문서 제목
   * @param type 문서 유형
   * @param content 문서 내용
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @returns 생성된 문서 정보
   */
  async createDocument(title, type, content, projectCode) {
    return this.sendSwdpCommand("documents/create", {
      title,
      type,
      content,
      projectCode
    });
  }
  /**
   * Git 저장소에서 사용자 정보 가져오기
   * @returns 사용자 정보
   */
  async getUserInfoFromGit() {
    return this.sendSwdpCommand("git/user-info", {});
  }
};

// src/core/auth/UserAuthService.ts
var vscode4 = __toESM(require("vscode"));
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var import_events4 = require("events");
var UserAuthService = class {
  /**
   * 생성자
   * @param configService 설정 서비스
   */
  constructor(configService) {
    this.configService = configService;
    /**
     * 이벤트 이미터
     */
    this.eventEmitter = new import_events4.EventEmitter();
    /**
     * 사용자 정보
     */
    this.userInfo = {};
    /**
     * 사용자 설정
     */
    this.userSettings = {};
    /**
     * 초기화 완료 여부
     */
    this.initialized = false;
  }
  /**
   * 싱글톤 인스턴스 가져오기
   * @deprecated 싱글톤 패턴 대신 의존성 주입 사용 권장
   * @returns UserAuthService 인스턴스
   */
  static getInstance() {
    if (!UserAuthService.instance) {
      UserAuthService.instance = new UserAuthService(ConfigService.getInstance());
    }
    return UserAuthService.instance;
  }
  /**
   * 팩토리 메서드: 인스턴스 생성
   * @param configService 설정 서비스
   * @returns UserAuthService 인스턴스
   */
  static createInstance(configService) {
    return new UserAuthService(configService);
  }
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
  /**
   * 서비스 초기화
   */
  async initialize() {
    try {
      await this.loadUserInfo();
      if (!this.userInfo.gitUsername || !this.userInfo.gitEmail) {
        try {
          const gitInfo = await this.extractGitUserInfo();
          if (gitInfo) {
            this.userInfo = {
              ...this.userInfo,
              ...gitInfo
            };
            await this.saveUserInfo();
          }
        } catch (error) {
          console.warn("Git \uC0AC\uC6A9\uC790 \uC815\uBCF4 \uCD94\uCD9C \uC2E4\uD328:", error);
        }
      }
      await this.loadUserSettings();
      this.initialized = true;
      console.log("\uC0AC\uC6A9\uC790 \uC778\uC99D \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC644\uB8CC");
    } catch (error) {
      console.error("\uC0AC\uC6A9\uC790 \uC778\uC99D \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      throw error;
    }
  }
  /**
   * 초기화 확인
   */
  checkInitialized() {
    if (!this.initialized) {
      throw new Error("\uC0AC\uC6A9\uC790 \uC778\uC99D \uC11C\uBE44\uC2A4\uAC00 \uCD08\uAE30\uD654\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
  }
  /**
   * 초기화 상태 확인
   * @returns 초기화 상태
   */
  isInitialized() {
    return this.initialized;
  }
  /**
   * 사용자 정보 가져오기
   * @returns 사용자 정보
   */
  getUserInfo() {
    this.checkInitialized();
    return { ...this.userInfo };
  }
  /**
   * 사용자 설정 가져오기
   * @returns 사용자 설정
   */
  getUserSettings() {
    this.checkInitialized();
    return { ...this.userSettings };
  }
  /**
   * 사용자 ID 설정
   * @param userId 사용자 ID
   */
  async setUserId(userId) {
    this.checkInitialized();
    this.userInfo.userId = userId;
    await this.saveUserInfo();
    this.eventEmitter.emit("user_info_changed" /* USER_INFO_CHANGED */, this.userInfo);
  }
  /**
   * 접근 토큰 설정
   * @param token 접근 토큰
   */
  async setToken(token) {
    this.checkInitialized();
    this.userInfo.token = token;
    await this.saveUserInfo();
    this.eventEmitter.emit("user_info_changed" /* USER_INFO_CHANGED */, this.userInfo);
  }
  /**
   * 현재 프로젝트 설정
   * @param projectCode 프로젝트 코드
   */
  async setCurrentProject(projectCode) {
    this.checkInitialized();
    this.userSettings.currentProject = projectCode;
    await this.saveUserSettings();
    this.eventEmitter.emit("user_settings_changed" /* USER_SETTINGS_CHANGED */, this.userSettings);
  }
  /**
   * 사용자 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateUserSettings(settings) {
    this.checkInitialized();
    this.userSettings = {
      ...this.userSettings,
      ...settings
    };
    await this.saveUserSettings();
    this.eventEmitter.emit("user_settings_changed" /* USER_SETTINGS_CHANGED */, this.userSettings);
  }
  /**
   * 로그인
   * @param userId 사용자 ID
   * @param token 접근 토큰
   */
  async login(userId, token) {
    this.checkInitialized();
    this.userInfo.userId = userId;
    this.userInfo.token = token;
    await this.saveUserInfo();
    this.eventEmitter.emit("logged_in" /* LOGGED_IN */, this.userInfo);
    this.eventEmitter.emit("user_info_changed" /* USER_INFO_CHANGED */, this.userInfo);
  }
  /**
   * 로그아웃
   */
  async logout() {
    this.checkInitialized();
    delete this.userInfo.token;
    await this.saveUserInfo();
    this.eventEmitter.emit("logged_out" /* LOGGED_OUT */);
    this.eventEmitter.emit("user_info_changed" /* USER_INFO_CHANGED */, this.userInfo);
  }
  /**
   * Git 저장소에서 사용자 정보 추출
   * @returns Git 사용자 정보
   */
  async extractGitUserInfo() {
    try {
      const workspaceFolders = vscode4.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("\uC5F4\uB9B0 \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4");
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const gitConfigPath = path2.join(workspaceRoot, ".git", "config");
      if (!fs2.existsSync(gitConfigPath)) {
        throw new Error("Git \uC800\uC7A5\uC18C\uAC00 \uC544\uB2D9\uB2C8\uB2E4");
      }
      const configContent = fs2.readFileSync(gitConfigPath, "utf8");
      const usernameMatch = configContent.match(/\[user\][^\[]*name\s*=\s*([^\n\r]*)/);
      const emailMatch = configContent.match(/\[user\][^\[]*email\s*=\s*([^\n\r]*)/);
      const gitUsername = usernameMatch?.[1]?.trim();
      const gitEmail = emailMatch?.[1]?.trim();
      const result = {};
      if (gitUsername)
        result.gitUsername = gitUsername;
      if (gitEmail)
        result.gitEmail = gitEmail;
      return result;
    } catch (error) {
      console.warn("Git \uC0AC\uC6A9\uC790 \uC815\uBCF4 \uCD94\uCD9C \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return {};
    }
  }
  /**
   * 설정에서 사용자 정보 로드
   */
  async loadUserInfo() {
    try {
      const userConfig = this.configService.getUserConfig();
      if (userConfig && userConfig["auth"]) {
        const auth = userConfig["auth"];
        this.userInfo = {
          userId: auth["userId"],
          gitUsername: auth["gitUsername"],
          gitEmail: auth["gitEmail"],
          token: auth["token"]
        };
      }
    } catch (error) {
      console.warn("\uC0AC\uC6A9\uC790 \uC815\uBCF4 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * 설정에 사용자 정보 저장
   */
  async saveUserInfo() {
    try {
      await this.configService.updateUserConfig({
        auth: { ...this.userInfo }
      });
    } catch (error) {
      console.error("\uC0AC\uC6A9\uC790 \uC815\uBCF4 \uC800\uC7A5 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      throw error;
    }
  }
  /**
   * 설정에서 사용자 설정 로드
   */
  async loadUserSettings() {
    try {
      const userConfig = this.configService.getUserConfig();
      if (userConfig && userConfig["settings"]) {
        this.userSettings = { ...userConfig["settings"] };
      }
    } catch (error) {
      console.warn("\uC0AC\uC6A9\uC790 \uC124\uC815 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * 설정에 사용자 설정 저장
   */
  async saveUserSettings() {
    try {
      await this.configService.updateUserConfig({
        settings: { ...this.userSettings }
      });
    } catch (error) {
      console.error("\uC0AC\uC6A9\uC790 \uC124\uC815 \uC800\uC7A5 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      throw error;
    }
  }
};

// src/core/domain/SwdpDomainService.ts
var SwdpDomainService = class {
  /**
   * 생성자
   */
  constructor(configService, userAuthService, swdpClient) {
    this.configService = configService;
    this.userAuthService = userAuthService;
    this.swdpClient = swdpClient;
    /**
     * 이벤트 이미터
     */
    this.eventEmitter = new import_events5.EventEmitter();
    /**
     * 프로젝트 캐시
     */
    this.projectsCache = /* @__PURE__ */ new Map();
    /**
     * 작업 캐시 (프로젝트 코드별)
     */
    this.tasksCache = /* @__PURE__ */ new Map();
    /**
     * 문서 캐시 (프로젝트 코드별)
     */
    this.documentsCache = /* @__PURE__ */ new Map();
    /**
     * 빌드 캐시
     */
    this.buildsCache = /* @__PURE__ */ new Map();
    /**
     * 초기화 완료 여부
     */
    this.initialized = false;
    /**
     * 캐시 유효 시간 (밀리초)
     */
    this.cacheTTL = 5 * 60 * 1e3;
  }
  /**
   * 팩토리 메서드: 의존성 주입을 통한 인스턴스 생성
   */
  static createInstance(configService, userAuthService) {
    const config = configService.getPluginConfig();
    const swdpConfig = config && typeof config === "object" && "swdp" in config ? config.swdp : null;
    const apeCoreUrl = swdpConfig?.apeCoreUrl || "http://localhost:8080";
    const bypassSsl = swdpConfig?.bypassSsl !== false;
    const swdpClient = new SwdpClientService(apeCoreUrl, bypassSsl);
    return new SwdpDomainService(configService, userAuthService, swdpClient);
  }
  /**
   * 레거시 싱글톤 접근 방식 - 점진적 마이그레이션을 위해 유지
   * @deprecated 싱글톤 패턴 대신 의존성 주입 사용 권장
   * @returns SwdpDomainService 인스턴스
   */
  static getInstance() {
    if (!SwdpDomainService.instance) {
      const configService = ConfigService.getInstance();
      const userAuthService = UserAuthService.getInstance();
      SwdpDomainService.instance = SwdpDomainService.createInstance(
        configService,
        userAuthService
      );
    }
    return SwdpDomainService.instance;
  }
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
  /**
   * 초기화
   */
  async initialize() {
    try {
      if (!this.userAuthService.isInitialized()) {
        await this.userAuthService.initialize();
      }
      const userInfo = this.userAuthService.getUserInfo();
      const userSettings = this.userAuthService.getUserSettings();
      await this.swdpClient.initialize({
        userId: userInfo.userId,
        gitUsername: userInfo.gitUsername,
        gitEmail: userInfo.gitEmail,
        token: userInfo.token
      });
      this.currentProject = userSettings.currentProject;
      const ttl = this.configService.getAppConfig()?.cache?.ttl;
      if (ttl && typeof ttl === "number") {
        this.cacheTTL = ttl;
      }
      this.initialized = true;
      console.log("SWDP \uB3C4\uBA54\uC778 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC644\uB8CC");
    } catch (error) {
      console.error("SWDP \uB3C4\uBA54\uC778 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 초기화 확인
   */
  checkInitialized() {
    if (!this.initialized) {
      throw new Error("SWDP \uB3C4\uBA54\uC778 \uC11C\uBE44\uC2A4\uAC00 \uCD08\uAE30\uD654\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
  }
  /**
   * 초기화 상태 확인
   * @returns 초기화 상태
   */
  isInitialized() {
    return this.initialized;
  }
  /**
   * 프로젝트 목록 가져오기
   * @param forceRefresh 강제 새로고침 여부
   * @returns 프로젝트 목록
   */
  async getProjects(forceRefresh = false) {
    this.checkInitialized();
    try {
      if (this.projectsCache.size > 0 && !forceRefresh) {
        return Array.from(this.projectsCache.values());
      }
      const result = await this.swdpClient.getProjects();
      const projects = result.projects || [];
      this.projectsCache.clear();
      for (const project of projects) {
        this.projectsCache.set(project.code, project);
      }
      this.eventEmitter.emit("projects_loaded" /* PROJECTS_LOADED */, projects);
      return projects;
    } catch (error) {
      console.error("\uD504\uB85C\uC81D\uD2B8 \uBAA9\uB85D \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 프로젝트 세부 정보 가져오기
   * @param projectCode 프로젝트 코드
   * @param forceRefresh 강제 새로고침 여부
   * @returns 프로젝트 세부 정보
   */
  async getProjectDetails(projectCode, forceRefresh = false) {
    this.checkInitialized();
    try {
      if (this.projectsCache.has(projectCode) && !forceRefresh) {
        return this.projectsCache.get(projectCode);
      }
      const result = await this.swdpClient.getProjectDetails(projectCode);
      const project = result.project;
      if (!project) {
        throw new Error(`\uD504\uB85C\uC81D\uD2B8\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${projectCode}`);
      }
      this.projectsCache.set(projectCode, project);
      return project;
    } catch (error) {
      console.error(`\uD504\uB85C\uC81D\uD2B8 \uC138\uBD80 \uC815\uBCF4 \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958 \uBC1C\uC0DD (${projectCode}):`, error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 현재 프로젝트 설정
   * @param projectCode 프로젝트 코드
   */
  async setCurrentProject(projectCode) {
    this.checkInitialized();
    try {
      await this.swdpClient.setCurrentProject(projectCode);
      this.currentProject = projectCode;
      await this.userAuthService.setCurrentProject(projectCode);
      console.log(`\uD604\uC7AC \uD504\uB85C\uC81D\uD2B8\uAC00 \uC124\uC815\uB428: ${projectCode}`);
    } catch (error) {
      console.error(`\uD604\uC7AC \uD504\uB85C\uC81D\uD2B8 \uC124\uC815 \uC911 \uC624\uB958 \uBC1C\uC0DD (${projectCode}):`, error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 현재 프로젝트 가져오기
   * @returns 현재 프로젝트 코드
   */
  getCurrentProject() {
    return this.currentProject;
  }
  /**
   * 작업 목록 가져오기
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @param forceRefresh 강제 새로고침 여부
   * @returns 작업 목록
   */
  async getTasks(projectCode, forceRefresh = false) {
    this.checkInitialized();
    try {
      const targetProject = projectCode || this.currentProject;
      if (!targetProject) {
        throw new Error("\uD504\uB85C\uC81D\uD2B8\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      if (this.tasksCache.has(targetProject) && !forceRefresh) {
        return this.tasksCache.get(targetProject);
      }
      const result = await this.swdpClient.getTasks(targetProject);
      const tasks = result.tasks || [];
      const tasksWithProject = tasks.map((task) => ({
        ...task,
        projectCode: targetProject
      }));
      this.tasksCache.set(targetProject, tasksWithProject);
      this.eventEmitter.emit("tasks_loaded" /* TASKS_LOADED */, tasksWithProject);
      return tasksWithProject;
    } catch (error) {
      console.error("\uC791\uC5C5 \uBAA9\uB85D \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 작업 세부 정보 가져오기
   * @param taskId 작업 ID
   * @returns 작업 세부 정보
   */
  async getTaskDetails(taskId) {
    this.checkInitialized();
    try {
      const result = await this.swdpClient.getTaskDetails(taskId);
      const task = result.task;
      if (!task) {
        throw new Error(`\uC791\uC5C5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${taskId}`);
      }
      if (!task.projectCode && task.project) {
        task.projectCode = task.project;
      }
      if (task.projectCode) {
        if (!this.tasksCache.has(task.projectCode)) {
          this.tasksCache.set(task.projectCode, []);
        }
        const tasks = this.tasksCache.get(task.projectCode);
        const taskIndex = tasks.findIndex((t) => t.id === taskId);
        if (taskIndex >= 0) {
          tasks[taskIndex] = task;
        } else {
          tasks.push(task);
        }
      }
      return task;
    } catch (error) {
      console.error(`\uC791\uC5C5 \uC138\uBD80 \uC815\uBCF4 \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958 \uBC1C\uC0DD (${taskId}):`, error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 작업 생성
   * @param title 작업 제목
   * @param description 작업 설명
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @param params 추가 파라미터
   * @returns 생성된 작업 정보
   */
  async createTask(title, description, projectCode, params) {
    this.checkInitialized();
    try {
      const targetProject = projectCode || this.currentProject;
      if (!targetProject) {
        throw new Error("\uD504\uB85C\uC81D\uD2B8\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      const result = await this.swdpClient.createTask(title, description, targetProject, params);
      const task = result.task || {
        id: result.taskId,
        title,
        description,
        projectCode: targetProject,
        status: "created"
      };
      if (!this.tasksCache.has(targetProject)) {
        this.tasksCache.set(targetProject, []);
      }
      const tasks = this.tasksCache.get(targetProject);
      tasks.push(task);
      this.eventEmitter.emit("task_changed" /* TASK_CHANGED */, task);
      return task;
    } catch (error) {
      console.error("\uC791\uC5C5 \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 작업 상태 업데이트
   * @param taskId 작업 ID
   * @param status 새 상태
   * @returns 업데이트된 작업 정보
   */
  async updateTaskStatus(taskId, status) {
    this.checkInitialized();
    try {
      const result = await this.swdpClient.updateTaskStatus(taskId, status);
      const task = result.task;
      if (!task) {
        throw new Error(`\uC791\uC5C5\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${taskId}`);
      }
      if (!task.projectCode && task.project) {
        task.projectCode = task.project;
      }
      if (task.projectCode) {
        if (!this.tasksCache.has(task.projectCode)) {
          this.tasksCache.set(task.projectCode, []);
        }
        const tasks = this.tasksCache.get(task.projectCode);
        const taskIndex = tasks.findIndex((t) => t.id === taskId);
        if (taskIndex >= 0) {
          tasks[taskIndex] = task;
        } else {
          tasks.push(task);
        }
      }
      this.eventEmitter.emit("task_changed" /* TASK_CHANGED */, task);
      return task;
    } catch (error) {
      console.error(`\uC791\uC5C5 \uC0C1\uD0DC \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958 \uBC1C\uC0DD (${taskId}):`, error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 문서 목록 가져오기
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @param forceRefresh 강제 새로고침 여부
   * @returns 문서 목록
   */
  async getDocuments(projectCode, forceRefresh = false) {
    this.checkInitialized();
    try {
      const targetProject = projectCode || this.currentProject;
      if (!targetProject) {
        throw new Error("\uD504\uB85C\uC81D\uD2B8\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      if (this.documentsCache.has(targetProject) && !forceRefresh) {
        return this.documentsCache.get(targetProject);
      }
      const result = await this.swdpClient.getDocuments(targetProject);
      const documents = result.documents || [];
      const documentsWithProject = documents.map((doc) => ({
        ...doc,
        projectCode: targetProject
      }));
      this.documentsCache.set(targetProject, documentsWithProject);
      this.eventEmitter.emit("documents_loaded" /* DOCUMENTS_LOADED */, documentsWithProject);
      return documentsWithProject;
    } catch (error) {
      console.error("\uBB38\uC11C \uBAA9\uB85D \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 문서 세부 정보 가져오기
   * @param docId 문서 ID
   * @returns 문서 세부 정보
   */
  async getDocumentDetails(docId) {
    this.checkInitialized();
    try {
      const result = await this.swdpClient.getDocumentDetails(docId);
      const document = result.document;
      if (!document) {
        throw new Error(`\uBB38\uC11C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC74C: ${docId}`);
      }
      if (!document.projectCode && document.project) {
        document.projectCode = document.project;
      }
      if (document.projectCode) {
        if (!this.documentsCache.has(document.projectCode)) {
          this.documentsCache.set(document.projectCode, []);
        }
        const documents = this.documentsCache.get(document.projectCode);
        const docIndex = documents.findIndex((d) => d.id === docId);
        if (docIndex >= 0) {
          documents[docIndex] = document;
        } else {
          documents.push(document);
        }
      }
      return document;
    } catch (error) {
      console.error(`\uBB38\uC11C \uC138\uBD80 \uC815\uBCF4 \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958 \uBC1C\uC0DD (${docId}):`, error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 문서 생성
   * @param title 문서 제목
   * @param type 문서 유형
   * @param content 문서 내용
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @returns 생성된 문서 정보
   */
  async createDocument(title, type, content, projectCode) {
    this.checkInitialized();
    try {
      const targetProject = projectCode || this.currentProject;
      if (!targetProject) {
        throw new Error("\uD504\uB85C\uC81D\uD2B8\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      const result = await this.swdpClient.createDocument(title, type, content, targetProject);
      const document = result.document || {
        id: result.docId,
        title,
        type,
        content,
        projectCode: targetProject,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!this.documentsCache.has(targetProject)) {
        this.documentsCache.set(targetProject, []);
      }
      const documents = this.documentsCache.get(targetProject);
      documents.push(document);
      return document;
    } catch (error) {
      console.error("\uBB38\uC11C \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 빌드 시작
   * @param type 빌드 타입
   * @param watchMode 워치 모드 여부
   * @param createPr PR 생성 여부
   * @param params 추가 파라미터
   * @returns 빌드 정보
   */
  async startBuild(type, watchMode = false, createPr = false, params = {}) {
    this.checkInitialized();
    try {
      const result = await this.swdpClient.startBuild({
        type,
        watchMode,
        createPr,
        params
      });
      const build = {
        buildId: result.buildId,
        type,
        status: result.status || "pending",
        watchMode,
        createPr,
        timestamp: result.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        logs: []
      };
      this.buildsCache.set(build.buildId, build);
      this.startBuildStatusPolling(build.buildId);
      return build;
    } catch (error) {
      console.error("\uBE4C\uB4DC \uC2DC\uC791 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 빌드 상태 가져오기
   * @param buildId 빌드 ID (생략 시 최근 빌드)
   * @returns 빌드 상태
   */
  async getBuildStatus(buildId) {
    this.checkInitialized();
    try {
      if (!buildId) {
        let latestBuild = null;
        let latestTimestamp = 0;
        for (const build2 of this.buildsCache.values()) {
          const timestamp = new Date(build2.timestamp).getTime();
          if (timestamp > latestTimestamp) {
            latestBuild = build2;
            latestTimestamp = timestamp;
          }
        }
        if (latestBuild) {
          buildId = latestBuild.buildId;
        } else {
          const result2 = await this.swdpClient.getBuildStatus();
          if (!result2.buildId) {
            throw new Error("\uBE4C\uB4DC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
          }
          buildId = result2.buildId;
        }
      }
      const result = await this.swdpClient.getBuildStatus(buildId);
      const build = {
        buildId,
        type: result.type || "unknown",
        status: result.status || "unknown",
        watchMode: result.watchMode || false,
        createPr: result.createPr || false,
        timestamp: result.timestamp || (/* @__PURE__ */ new Date()).toISOString()
      };
      this.buildsCache.set(buildId, build);
      this.eventEmitter.emit("build_status_changed" /* BUILD_STATUS_CHANGED */, build);
      return build;
    } catch (error) {
      console.error("\uBE4C\uB4DC \uC0C1\uD0DC \uC870\uD68C \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 빌드 로그 가져오기
   * @param buildId 빌드 ID
   * @returns 빌드 로그
   */
  async getBuildLogs(buildId) {
    this.checkInitialized();
    try {
      const result = await this.swdpClient.getBuildLogs(buildId);
      const logs = result.logs ? typeof result.logs === "string" ? result.logs.split("\n") : result.logs : [];
      if (this.buildsCache.has(buildId)) {
        const build = this.buildsCache.get(buildId);
        build.logs = logs;
        this.buildsCache.set(buildId, build);
      }
      return logs;
    } catch (error) {
      console.error(`\uBE4C\uB4DC \uB85C\uADF8 \uC870\uD68C \uC911 \uC624\uB958 \uBC1C\uC0DD (${buildId}):`, error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 빌드 취소
   * @param buildId 빌드 ID
   * @returns 취소 결과
   */
  async cancelBuild(buildId) {
    this.checkInitialized();
    try {
      await this.swdpClient.cancelBuild(buildId);
      if (this.buildsCache.has(buildId)) {
        const build = this.buildsCache.get(buildId);
        build.status = "canceled";
        this.buildsCache.set(buildId, build);
        this.eventEmitter.emit("build_status_changed" /* BUILD_STATUS_CHANGED */, build);
      }
      return true;
    } catch (error) {
      console.error(`\uBE4C\uB4DC \uCDE8\uC18C \uC911 \uC624\uB958 \uBC1C\uC0DD (${buildId}):`, error);
      this.eventEmitter.emit("error_occurred" /* ERROR_OCCURRED */, error);
      throw error;
    }
  }
  /**
   * 빌드 상태 폴링 시작
   * @param buildId 빌드 ID
   */
  startBuildStatusPolling(buildId) {
    const interval = 5;
    setTimeout(async () => {
      try {
        const build = await this.getBuildStatus(buildId);
        const isCompleted = ["success", "failed", "canceled"].includes(build.status);
        if (isCompleted) {
          try {
            await this.getBuildLogs(buildId);
          } catch (error) {
            console.warn(`\uBE4C\uB4DC \uB85C\uADF8 \uC870\uD68C \uC2E4\uD328 (${buildId}):`, error);
          }
        } else {
          setTimeout(() => this.startBuildStatusPolling(buildId), interval * 1e3);
        }
      } catch (error) {
        console.warn(`\uBE4C\uB4DC \uC0C1\uD0DC \uD3F4\uB9C1 \uC911 \uC624\uB958 \uBC1C\uC0DD (${buildId}):`, error);
      }
    }, 5e3);
  }
  /**
   * 캐시된 프로젝트 목록 가져오기
   * @returns 캐시된 프로젝트 목록
   */
  getCachedProjects() {
    return Array.from(this.projectsCache.values());
  }
  /**
   * 캐시 비우기
   */
  clearCache() {
    this.projectsCache.clear();
    this.tasksCache.clear();
    this.documentsCache.clear();
    this.buildsCache.clear();
    console.log("SWDP \uB3C4\uBA54\uC778 \uC11C\uBE44\uC2A4 \uCE90\uC2DC \uBE44\uC6C0");
  }
};

// src/core/workflow/SwdpWorkflowService.ts
var import_events6 = require("events");
var SwdpWorkflowService = class {
  /**
   * 생성자
   */
  constructor(configService, userAuthService, swdpDomainService) {
    this.configService = configService;
    this.userAuthService = userAuthService;
    this.swdpDomainService = swdpDomainService;
    /**
     * 이벤트 이미터
     */
    this.eventEmitter = new import_events6.EventEmitter();
    /**
     * 워크플로우 로그
     */
    this.workflowLogs = /* @__PURE__ */ new Map();
    /**
     * 초기화 완료 여부
     */
    this.initialized = false;
    this.swdpDomainService.on("task_changed" /* TASK_CHANGED */, (task) => {
      this.handleTaskChanged(task);
    });
  }
  /**
   * 팩토리 메서드: 의존성 주입을 통한 인스턴스 생성
   */
  static createInstance(configService, userAuthService, swdpDomainService) {
    return new SwdpWorkflowService(configService, userAuthService, swdpDomainService);
  }
  /**
   * 레거시 싱글톤 접근 방식 - 점진적 마이그레이션을 위해 유지
   * @deprecated 싱글톤 패턴 대신 의존성 주입 사용 권장
   * @returns SwdpWorkflowService 인스턴스
   */
  static getInstance() {
    if (!SwdpWorkflowService.instance) {
      const configService = ConfigService.getInstance();
      const userAuthService = UserAuthService.getInstance();
      const swdpDomainService = SwdpDomainService.getInstance();
      SwdpWorkflowService.instance = SwdpWorkflowService.createInstance(
        configService,
        userAuthService,
        swdpDomainService
      );
    }
    return SwdpWorkflowService.instance;
  }
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
  /**
   * 초기화
   */
  async initialize() {
    try {
      if (!this.userAuthService.isInitialized()) {
        await this.userAuthService.initialize();
      }
      if (!this.swdpDomainService.isInitialized()) {
        await this.swdpDomainService.initialize();
      }
      const userSettings = this.userAuthService.getUserSettings();
      if (userSettings.currentTask) {
        this.currentTaskId = userSettings.currentTask;
        console.log(`\uD604\uC7AC \uC791\uC5C5\uC774 \uC124\uC815\uB428: ${this.currentTaskId}`);
      }
      this.initialized = true;
      console.log("SWDP \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC644\uB8CC");
    } catch (error) {
      console.error("SWDP \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      throw error;
    }
  }
  /**
   * 초기화 확인
   */
  checkInitialized() {
    if (!this.initialized) {
      throw new Error("SWDP \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC11C\uBE44\uC2A4\uAC00 \uCD08\uAE30\uD654\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
  }
  /**
   * 초기화 상태 확인
   * @returns 초기화 상태
   */
  isInitialized() {
    return this.initialized;
  }
  /**
   * 현재 작업 설정
   * @param taskId 작업 ID
   */
  async setCurrentTask(taskId) {
    this.checkInitialized();
    try {
      const task = await this.swdpDomainService.getTaskDetails(taskId);
      this.currentTaskId = taskId;
      await this.userAuthService.updateUserSettings({
        currentTask: taskId
      });
      console.log(`\uD604\uC7AC \uC791\uC5C5\uC774 \uC124\uC815\uB428: ${taskId} (${task.title})`);
      this.addWorkflowLog(taskId, {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        taskId,
        actionType: "task_selection",
        description: `\uC791\uC5C5 "${task.title}" \uC120\uD0DD\uB428`,
        status: "success",
        metadata: {
          taskStatus: task.status
        }
      });
    } catch (error) {
      console.error(`\uD604\uC7AC \uC791\uC5C5 \uC124\uC815 \uC911 \uC624\uB958 \uBC1C\uC0DD (${taskId}):`, error);
      throw error;
    }
  }
  /**
   * 현재 작업 가져오기
   * @returns 현재 작업 ID
   */
  getCurrentTaskId() {
    return this.currentTaskId;
  }
  /**
   * 현재 작업 상세 정보 가져오기
   * @returns 현재 작업 상세 정보
   */
  async getCurrentTask() {
    this.checkInitialized();
    if (!this.currentTaskId) {
      return void 0;
    }
    try {
      return await this.swdpDomainService.getTaskDetails(this.currentTaskId);
    } catch (error) {
      console.error(`\uD604\uC7AC \uC791\uC5C5 \uC870\uD68C \uC911 \uC624\uB958 \uBC1C\uC0DD (${this.currentTaskId}):`, error);
      return void 0;
    }
  }
  /**
   * Git 커밋과 작업 연결
   * @param commitId Git 커밋 ID
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @param message 커밋 메시지
   * @returns 연결 성공 여부
   */
  async linkCommitToTask(commitId, taskId, message) {
    this.checkInitialized();
    try {
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error("\uC791\uC5C5\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      const task = await this.swdpDomainService.getTaskDetails(targetTaskId);
      this.addWorkflowLog(targetTaskId, {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        taskId: targetTaskId,
        actionType: "git_commit_linked",
        description: `Git \uCEE4\uBC0B "${commitId.substring(0, 8)}" \uC5F0\uACB0\uB428${message ? ": " + message : ""}`,
        status: "success",
        metadata: {
          commitId,
          commitMessage: message,
          taskStatus: task.status
        }
      });
      this.eventEmitter.emit("task_linked" /* TASK_LINKED */, {
        taskId: targetTaskId,
        commitId,
        message
      });
      return true;
    } catch (error) {
      console.error(`Git \uCEE4\uBC0B \uC5F0\uACB0 \uC911 \uC624\uB958 \uBC1C\uC0DD (${commitId}):`, error);
      return false;
    }
  }
  /**
   * Jira 이슈와 작업 연결
   * @param issueKey Jira 이슈 키
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @returns 연결 성공 여부
   */
  async linkJiraIssueToTask(issueKey, taskId) {
    this.checkInitialized();
    try {
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error("\uC791\uC5C5\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      const task = await this.swdpDomainService.getTaskDetails(targetTaskId);
      this.addWorkflowLog(targetTaskId, {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        taskId: targetTaskId,
        actionType: "jira_issue_linked",
        description: `Jira \uC774\uC288 "${issueKey}" \uC5F0\uACB0\uB428`,
        status: "success",
        metadata: {
          issueKey,
          taskStatus: task.status
        }
      });
      this.eventEmitter.emit("task_linked" /* TASK_LINKED */, {
        taskId: targetTaskId,
        issueKey
      });
      return true;
    } catch (error) {
      console.error(`Jira \uC774\uC288 \uC5F0\uACB0 \uC911 \uC624\uB958 \uBC1C\uC0DD (${issueKey}):`, error);
      return false;
    }
  }
  /**
   * 작업 상태 변경
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @param status 새 상태
   * @returns 업데이트된 작업
   */
  async updateTaskStatus(taskId, status) {
    this.checkInitialized();
    try {
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error("\uC791\uC5C5\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      const updatedTask = await this.swdpDomainService.updateTaskStatus(targetTaskId, status);
      this.addWorkflowLog(targetTaskId, {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        taskId: targetTaskId,
        actionType: "task_status_changed",
        description: `\uC791\uC5C5 \uC0C1\uD0DC\uAC00 "${status}"(\uC73C)\uB85C \uBCC0\uACBD\uB428`,
        status: "success",
        metadata: {
          newStatus: status,
          oldStatus: updatedTask.status !== status ? updatedTask.status : void 0
        }
      });
      this.eventEmitter.emit("task_status_changed" /* TASK_STATUS_CHANGED */, {
        taskId: targetTaskId,
        status,
        task: updatedTask
      });
      return updatedTask;
    } catch (error) {
      console.error(`\uC791\uC5C5 \uC0C1\uD0DC \uBCC0\uACBD \uC911 \uC624\uB958 \uBC1C\uC0DD (${taskId}, ${status}):`, error);
      throw error;
    }
  }
  /**
   * 작업 변경 처리
   * @param task 변경된 작업
   */
  handleTaskChanged(task) {
    if (this.currentTaskId === task.id) {
      this.eventEmitter.emit("task_status_changed" /* TASK_STATUS_CHANGED */, {
        taskId: task.id,
        status: task.status,
        task
      });
    }
  }
  /**
   * 워크플로우 로그 추가
   * @param taskId 작업 ID
   * @param logItem 로그 항목
   */
  addWorkflowLog(taskId, logItem) {
    if (!this.workflowLogs.has(taskId)) {
      this.workflowLogs.set(taskId, []);
    }
    const logs = this.workflowLogs.get(taskId);
    logs.push(logItem);
    this.saveWorkflowLogs(taskId);
  }
  /**
   * 워크플로우 로그 가져오기
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @returns 워크플로우 로그
   */
  getWorkflowLogs(taskId) {
    const targetTaskId = taskId || this.currentTaskId;
    if (!targetTaskId) {
      return [];
    }
    if (this.workflowLogs.has(targetTaskId)) {
      return [...this.workflowLogs.get(targetTaskId)];
    }
    this.loadWorkflowLogs(targetTaskId);
    return this.workflowLogs.has(targetTaskId) ? [...this.workflowLogs.get(targetTaskId)] : [];
  }
  /**
   * 워크플로우 로그 저장
   * @param taskId 작업 ID
   */
  saveWorkflowLogs(taskId) {
    try {
      const logs = this.workflowLogs.get(taskId);
      if (!logs)
        return;
      const workflowLogsConfig = this.configService.getUserConfig()?.workflowLogs || {};
      workflowLogsConfig[taskId] = logs;
      this.configService.updateUserConfig({
        workflowLogs: workflowLogsConfig
      });
    } catch (error) {
      console.warn(`\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uB85C\uADF8 \uC800\uC7A5 \uC911 \uC624\uB958 \uBC1C\uC0DD (${taskId}):`, error);
    }
  }
  /**
   * 워크플로우 로그 로드
   * @param taskId 작업 ID
   */
  loadWorkflowLogs(taskId) {
    try {
      const workflowLogsConfig = this.configService.getUserConfig()?.workflowLogs || {};
      const logs = workflowLogsConfig[taskId] || [];
      this.workflowLogs.set(taskId, logs);
    } catch (error) {
      console.warn(`\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uB85C\uADF8 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD (${taskId}):`, error);
    }
  }
  /**
   * 작업 종료
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @param status 종료 상태 (기본값: 'completed')
   * @param comment 종료 코멘트
   * @returns 성공 여부
   */
  async completeTask(taskId, status = "completed", comment) {
    this.checkInitialized();
    try {
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error("\uC791\uC5C5\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      await this.swdpDomainService.updateTaskStatus(targetTaskId, status);
      this.addWorkflowLog(targetTaskId, {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        taskId: targetTaskId,
        actionType: "task_completed",
        description: `\uC791\uC5C5 \uC885\uB8CC: ${comment || "\uC791\uC5C5 \uC644\uB8CC"}`,
        status: "success",
        metadata: {
          finalStatus: status,
          comment
        }
      });
      if (targetTaskId === this.currentTaskId) {
        this.currentTaskId = void 0;
        await this.userAuthService.updateUserSettings({
          currentTask: void 0
        });
      }
      this.eventEmitter.emit("workflow_completed" /* WORKFLOW_COMPLETED */, {
        taskId: targetTaskId,
        status,
        comment
      });
      return true;
    } catch (error) {
      console.error(`\uC791\uC5C5 \uC885\uB8CC \uC911 \uC624\uB958 \uBC1C\uC0DD (${taskId}):`, error);
      this.eventEmitter.emit("workflow_failed" /* WORKFLOW_FAILED */, {
        taskId,
        error
      });
      return false;
    }
  }
  /**
   * 워크플로우 시작
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @param workflowType 워크플로우 유형
   * @param params 추가 파라미터
   * @returns 성공 여부
   */
  async startWorkflow(taskId, workflowType = "default", params) {
    this.checkInitialized();
    try {
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error("\uC791\uC5C5\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
      }
      const task = await this.swdpDomainService.getTaskDetails(targetTaskId);
      this.addWorkflowLog(targetTaskId, {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        taskId: targetTaskId,
        actionType: "workflow_started",
        description: `\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC2DC\uC791: ${workflowType}`,
        status: "success",
        metadata: {
          workflowType,
          taskStatus: task.status,
          params
        }
      });
      this.eventEmitter.emit("workflow_started" /* WORKFLOW_STARTED */, {
        taskId: targetTaskId,
        workflowType,
        params,
        task
      });
      return true;
    } catch (error) {
      console.error(`\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC2DC\uC791 \uC911 \uC624\uB958 \uBC1C\uC0DD (${taskId}, ${workflowType}):`, error);
      this.eventEmitter.emit("workflow_failed" /* WORKFLOW_FAILED */, {
        taskId,
        workflowType,
        error
      });
      return false;
    }
  }
};

// src/core/plugin-system/llm/PluginNaturalLanguageService.ts
var PluginNaturalLanguageService = class {
  /**
   * PluginNaturalLanguageService 생성자
   * @param llmService LLM 서비스
   * @param logger 로거 서비스
   * @param pluginId 플러그인 ID
   * @param commandPatterns 명령어 패턴 맵
   * @param availableCommands 사용 가능한 명령어 목록
   */
  constructor(llmService, logger, pluginId, commandPatterns, availableCommands) {
    this.llmService = llmService;
    this.logger = logger;
    this.pluginId = pluginId;
    this.commandPatterns = commandPatterns;
    this.availableCommands = availableCommands;
  }
  /**
   * 자연어 명령을 플러그인 명령어로 변환
   * @param naturalCommand 자연어 명령
   * @returns 변환된 명령어 정보
   */
  async convertNaturalCommand(naturalCommand) {
    try {
      this.logger.info(`\uC790\uC5F0\uC5B4 ${this.pluginId} \uBA85\uB839 \uBCC0\uD658 \uC2DC\uC791: "${naturalCommand}"`);
      const heuristicMatch = this.heuristicCommandMatch(naturalCommand);
      if (heuristicMatch && heuristicMatch.confidence > 0.8) {
        this.logger.info(`\uD734\uB9AC\uC2A4\uD2F1 \uB9E4\uCE6D \uACB0\uACFC: ${heuristicMatch.command} (\uC2E0\uB8B0\uB3C4: ${heuristicMatch.confidence})`);
        return heuristicMatch;
      }
      return await this.llmCommandMatch(naturalCommand, heuristicMatch);
    } catch (error) {
      this.logger.error(`\uC790\uC5F0\uC5B4 \uBA85\uB839 \uBCC0\uD658 \uC911 \uC624\uB958 \uBC1C\uC0DD: ${error}`);
      const defaultCommand = this.getDefaultCommand();
      return {
        command: defaultCommand,
        args: [],
        confidence: 0.5,
        explanation: `\uBA85\uB839\uC5B4 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD558\uC5EC \uAE30\uBCF8 ${defaultCommand} \uBA85\uB839\uC73C\uB85C \uCC98\uB9AC\uD569\uB2C8\uB2E4.`
      };
    }
  }
  /**
   * 휴리스틱 기반 명령어 매칭
   * @param naturalCommand 자연어 명령
   * @returns 매칭된 명령어 정보
   */
  heuristicCommandMatch(naturalCommand) {
    const normalizedInput = naturalCommand.toLowerCase().trim();
    let bestMatch = {
      command: "",
      score: 0,
      args: [],
      patternIndex: -1
    };
    this.commandPatterns.forEach((cmdPattern, index) => {
      for (const pattern of cmdPattern.patterns) {
        if (normalizedInput.includes(pattern)) {
          const score = pattern.length / normalizedInput.length;
          if (score > bestMatch.score) {
            bestMatch = {
              command: cmdPattern.command,
              score,
              args: cmdPattern.extractArgs ? cmdPattern.extractArgs(normalizedInput) : [],
              patternIndex: index
            };
          }
        }
      }
    });
    if (bestMatch.command) {
      return {
        command: bestMatch.command,
        args: bestMatch.args,
        confidence: bestMatch.score * 0.8,
        explanation: `\uC790\uC5F0\uC5B4 \uBA85\uB839 "${naturalCommand}"\uC744(\uB97C) @${this.pluginId}:${bestMatch.command} \uBA85\uB839\uC73C\uB85C \uBCC0\uD658\uD588\uC2B5\uB2C8\uB2E4.`
      };
    }
    return null;
  }
  /**
   * LLM 기반 명령어 매칭
   * @param naturalCommand 자연어 명령
   * @param heuristicMatch 휴리스틱 매칭 결과
   * @returns 매칭된 명령어 정보
   */
  async llmCommandMatch(naturalCommand, heuristicMatch) {
    const commandDescriptions = this.availableCommands.filter((cmd) => cmd.id !== "").map((cmd) => `- ${cmd.id}: ${cmd.description} (\uC0AC\uC6A9\uBC95: ${cmd.syntax})`).join("\n");
    let pluginSpecificInstructions = "";
    switch (this.pluginId) {
      case "git":
        pluginSpecificInstructions = `
## Git \uBA85\uB839\uC5B4 \uBCC0\uD658 \uAC00\uC774\uB4DC\uB77C\uC778:
- 'commit', '\uCEE4\uBC0B', '\uBCC0\uACBD\uC0AC\uD56D \uC800\uC7A5' \uB4F1\uC758 \uD45C\uD604\uC740 'commit' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC0C1\uD0DC', '\uBCC0\uACBD\uC0AC\uD56D', '\uBB50\uAC00 \uBC14\uB00C\uC5C8\uB294\uC9C0' \uB4F1\uC740 'status' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uBE0C\uB79C\uCE58 \uC0DD\uC131', '\uC0C8 \uBE0C\uB79C\uCE58' \uB4F1\uC740 'branch' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- 'pull request', 'PR', '\uD480\uB9AC\uD018' \uB4F1\uC740 'pr' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC800\uC7A5\uC18C \uBCF5\uC81C', '\uD074\uB860' \uB4F1\uC740 'clone' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC790\uB3D9 \uCEE4\uBC0B'\uC740 'auto-commit' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658 (\uD2B9\uD788 \uC88B\uC740 \uCEE4\uBC0B \uBA54\uC2DC\uC9C0\uB97C \uC694\uCCAD\uD558\uB294 \uACBD\uC6B0)
- 'diff', '\uCC28\uC774', '\uBE44\uAD50' \uB4F1\uC740 'diff' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658

## \uC6B0\uC120\uC21C\uC704:
1. \uBA85\uB839\uC5B4 \uC758\uB3C4\uAC00 \uBA85\uD655\uD55C \uACBD\uC6B0 \uD574\uB2F9 \uBA85\uB839\uC5B4\uB85C \uBCC0\uD658
2. 'auto-commit'\uC740 \uBA85\uD655\uD55C \uCEE4\uBC0B \uC791\uC5C5\uC774 \uD544\uC694\uD560 \uB54C\uB9CC \uC0AC\uC6A9
3. \uB2E8\uC21C \uC870\uD68C\uB098 \uC0C1\uD0DC \uD655\uC778\uC740 'status' \uBA85\uB839 \uC6B0\uC120 \uACE0\uB824
`;
        break;
      case "jira":
        pluginSpecificInstructions = `
## Jira \uBA85\uB839\uC5B4 \uBCC0\uD658 \uAC00\uC774\uB4DC\uB77C\uC778:
- '\uC774\uC288 \uC0DD\uC131', '\uD2F0\uCF13 \uB9CC\uB4E4\uAE30', '\uC0C8 \uC791\uC5C5' \uB4F1\uC740 'create' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC774\uC288 \uC870\uD68C', '\uD2F0\uCF13 \uBCF4\uAE30', '\uC774\uC288 \uD655\uC778' \uB4F1\uC740 'issue' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC774\uC288 \uBAA9\uB85D', '\uD2F0\uCF13 \uBAA9\uB85D', '\uC791\uC5C5 \uB9AC\uC2A4\uD2B8' \uB4F1\uC740 'list' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC774\uC288 \uD560\uB2F9', '\uB2F4\uB2F9\uC790 \uBCC0\uACBD' \uB4F1\uC740 'assign' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC774\uC288 \uC0C1\uD0DC \uBCC0\uACBD', '\uC9C4\uD589\uC911\uC73C\uB85C \uBCC0\uACBD' \uB4F1\uC740 'transition' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC774\uC288 \uB313\uAE00', '\uCF54\uBA58\uD2B8 \uCD94\uAC00' \uB4F1\uC740 'comment' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC774\uC288 \uC218\uC815', '\uD2F0\uCF13 \uC5C5\uB370\uC774\uD2B8' \uB4F1\uC740 'update' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658

## \uC6B0\uC120\uC21C\uC704:
1. \uD2B9\uC815 \uC774\uC288 \uD0A4(\uC608: PROJ-123)\uAC00 \uC5B8\uAE09\uB41C \uACBD\uC6B0 \uD574\uB2F9 \uC774\uC288\uC5D0 \uB300\uD55C \uC791\uC5C5\uC73C\uB85C \uD310\uB2E8
2. \uC774\uC288 \uC870\uD68C \uAD00\uB828 \uBA85\uB839\uC774 \uC6B0\uC120 (issue, list \uB4F1)
3. \uC774\uC288 \uC0DD\uC131 \uBC0F \uC218\uC815 \uAD00\uB828 \uBA85\uB839 (create, update \uB4F1)
`;
        break;
      case "swdp":
        pluginSpecificInstructions = `
## SWDP \uBA85\uB839\uC5B4 \uBCC0\uD658 \uAC00\uC774\uB4DC\uB77C\uC778:
- '\uBE4C\uB4DC', '\uCEF4\uD30C\uC77C', '\uB85C\uCEEC \uBE4C\uB4DC' \uB4F1\uC740 'build' \uB610\uB294 'build:local' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uBC30\uD3EC', '\uB9B4\uB9AC\uC988', '\uC5C5\uB85C\uB4DC' \uB4F1\uC740 'deploy' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uBE4C\uB4DC \uC0C1\uD0DC', '\uBE4C\uB4DC \uACB0\uACFC', '\uC9C4\uD589 \uC0C1\uD669' \uB4F1\uC740 'status' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uD14C\uC2A4\uD2B8 \uC694\uCCAD', 'TR \uC0DD\uC131', '\uD14C\uC2A4\uD2B8 \uC0DD\uC131' \uB4F1\uC740 'test-request' \uB610\uB294 'tr' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uB808\uC774\uC5B4 \uBE4C\uB4DC', '\uACC4\uCE35 \uBE4C\uB4DC' \uB4F1\uC740 'build:layer' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uC124\uC815', '\uD658\uACBD \uC124\uC815' \uB4F1\uC740 'config' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658

## \uC6B0\uC120\uC21C\uC704:
1. \uBE4C\uB4DC/\uBC30\uD3EC \uAD00\uB828 \uC791\uC5C5 \uBA85\uB839 \uC6B0\uC120 (build, deploy \uB4F1)
2. \uC0C1\uD0DC \uD655\uC778 \uAD00\uB828 \uBA85\uB839 (status)
3. \uD14C\uC2A4\uD2B8 \uAD00\uB828 \uBA85\uB839 (test-request \uB4F1)
`;
        break;
      case "pocket":
        pluginSpecificInstructions = `
## Pocket \uBA85\uB839\uC5B4 \uBCC0\uD658 \uAC00\uC774\uB4DC\uB77C\uC778:
- '\uD30C\uC77C \uBAA9\uB85D', '\uB514\uB809\uD1A0\uB9AC \uB0B4\uC6A9', '\uD3F4\uB354 \uBCF4\uAE30' \uB4F1\uC740 'ls' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uD30C\uC77C \uC815\uBCF4', '\uBA54\uD0C0\uB370\uC774\uD130', '\uC18D\uC131' \uB4F1\uC740 'info' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uD30C\uC77C \uB0B4\uC6A9', '\uD30C\uC77C \uC5F4\uAE30', '\uB0B4\uC6A9 \uBCF4\uAE30' \uB4F1\uC740 'load' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uD30C\uC77C \uC694\uC57D', '\uB0B4\uC6A9 \uC694\uC57D', '\uC694\uC57D\uD574\uC918' \uB4F1\uC740 'summarize' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uB514\uB809\uD1A0\uB9AC \uAD6C\uC870', '\uD3F4\uB354 \uD2B8\uB9AC', '\uD2B8\uB9AC \uBCF4\uAE30' \uB4F1\uC740 'tree' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uD30C\uC77C \uAC80\uC0C9', '\uC774\uB984\uC73C\uB85C \uAC80\uC0C9', '\uCC3E\uAE30' \uB4F1\uC740 'search' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uB0B4\uC6A9 \uAC80\uC0C9', '\uD14D\uC2A4\uD2B8 \uAC80\uC0C9', '\uD328\uD134 \uAC80\uC0C9' \uB4F1\uC740 'grep' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658
- '\uBC84\uD0B7 \uC815\uBCF4', '\uC2A4\uD1A0\uB9AC\uC9C0 \uC815\uBCF4' \uB4F1\uC740 'bucket' \uBA85\uB839\uC73C\uB85C \uBCC0\uD658

## \uC6B0\uC120\uC21C\uC704:
1. \uD2B9\uC815 \uD30C\uC77C \uACBD\uB85C\uAC00 \uC5B8\uAE09\uB41C \uACBD\uC6B0 \uD574\uB2F9 \uD30C\uC77C\uC5D0 \uB300\uD55C \uC791\uC5C5\uC73C\uB85C \uD310\uB2E8
2. \uBAA9\uB85D/\uAD6C\uC870 \uC870\uD68C \uAD00\uB828 \uBA85\uB839\uC774 \uC6B0\uC120 (ls, tree \uB4F1)
3. \uD30C\uC77C \uB0B4\uC6A9 \uAD00\uB828 \uBA85\uB839 (load, summarize \uB4F1)
4. \uAC80\uC0C9 \uAD00\uB828 \uBA85\uB839 (search, grep \uB4F1)

## \uC778\uC790 \uCD94\uCD9C \uAC00\uC774\uB4DC:
- \uB530\uC634\uD45C(", ')\uB85C \uAC10\uC2F8\uC9C4 \uD14D\uC2A4\uD2B8\uB294 \uAC80\uC0C9\uC5B4\uB098 \uACBD\uB85C\uB85C \uCD94\uCD9C
- \uD30C\uC77C \uACBD\uB85C\uB294 \uC77C\uBC18\uC801\uC73C\uB85C \uD655\uC7A5\uC790(.txt, .json \uB4F1)\uAC00 \uD3EC\uD568\uB41C \uD615\uD0DC
- \uB514\uB809\uD1A0\uB9AC \uACBD\uB85C\uB294 \uC77C\uBC18\uC801\uC73C\uB85C \uC2AC\uB798\uC2DC(/)\uB85C \uB05D\uB098\uB294 \uD615\uD0DC
`;
        break;
      default:
        break;
    }
    const prompt = `
\uB2F9\uC2E0\uC740 ${this.pluginId} \uBA85\uB839\uC5B4 \uBCC0\uD658 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. \uC0AC\uC6A9\uC790\uC758 \uC790\uC5F0\uC5B4 \uBA85\uB839\uC744 \uC801\uC808\uD55C ${this.pluginId} \uBA85\uB839\uC5B4\uB85C \uBCC0\uD658\uD574\uC8FC\uC138\uC694.

## \uC0AC\uC6A9 \uAC00\uB2A5\uD55C ${this.pluginId} \uBA85\uB839\uC5B4:
${commandDescriptions}

${pluginSpecificInstructions}

## \uC0AC\uC6A9\uC790 \uC785\uB825:
"${naturalCommand}"

${heuristicMatch ? `
## \uD734\uB9AC\uC2A4\uD2F1 \uBD84\uC11D \uACB0\uACFC:
- \uBA85\uB839\uC5B4: ${heuristicMatch.command}
- \uC778\uC790: ${JSON.stringify(heuristicMatch.args)}
- \uC2E0\uB8B0\uB3C4: ${heuristicMatch.confidence}
` : ""}

## \uCD9C\uB825 \uD615\uC2DD:
JSON \uD615\uC2DD\uC73C\uB85C \uB2E4\uC74C \uD544\uB4DC\uB97C \uD3EC\uD568\uD574 \uC751\uB2F5\uD574\uC8FC\uC138\uC694:
{
  "command": "\uC801\uC808\uD55C ${this.pluginId} \uBA85\uB839\uC5B4",
  "args": ["\uBA85\uB839\uC5B4 \uC778\uC790\uB4E4\uC758 \uBC30\uC5F4"],
  "confidence": 0.1~1.0 \uC0AC\uC774\uC758 \uC2E0\uB8B0\uB3C4 \uAC12,
  "explanation": "\uBCC0\uD658 \uC774\uC720\uC5D0 \uB300\uD55C \uAC04\uB2E8\uD55C \uC124\uBA85",
  "alternatives": [
    {
      "command": "\uB300\uC548 ${this.pluginId} \uBA85\uB839\uC5B4",
      "args": ["\uBA85\uB839\uC5B4 \uC778\uC790\uB4E4\uC758 \uBC30\uC5F4"],
      "confidence": 0.1~1.0 \uC0AC\uC774\uC758 \uC2E0\uB8B0\uB3C4 \uAC12
    }
  ]
}

\uBA85\uB839\uC5B4 \uBD84\uC11D \uACB0\uACFC\uB9CC JSON \uD615\uC2DD\uC73C\uB85C \uBC18\uD658\uD574\uC8FC\uC138\uC694. \uB2E4\uB978 \uC124\uBA85\uC774\uB098 \uB0B4\uC6A9\uC740 \uD3EC\uD568\uD558\uC9C0 \uB9C8\uC138\uC694.
`;
    try {
      const response = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: "system",
            content: "\uB2F9\uC2E0\uC740 \uBA85\uB839\uC5B4 \uBCC0\uD658 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. JSON \uD615\uC2DD\uC73C\uB85C \uC751\uB2F5\uD574\uC8FC\uC138\uC694."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      }).then((result2) => result2.content);
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```|{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error("LLM \uC751\uB2F5\uC5D0\uC11C JSON\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
      }
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const result = JSON.parse(jsonStr);
      this.logger.info(`LLM \uBA85\uB839\uC5B4 \uBCC0\uD658 \uACB0\uACFC: ${result.command}`);
      return result;
    } catch (error) {
      this.logger.error(`LLM \uBA85\uB839\uC5B4 \uBCC0\uD658 \uC911 \uC624\uB958 \uBC1C\uC0DD: ${error}`);
      if (heuristicMatch) {
        return heuristicMatch;
      }
      const defaultCommand = this.getDefaultCommand();
      return {
        command: defaultCommand,
        args: [],
        confidence: 0.3,
        explanation: "LLM \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD558\uC5EC \uAE30\uBCF8 \uBA85\uB839\uC73C\uB85C \uCC98\uB9AC\uD569\uB2C8\uB2E4."
      };
    }
  }
  /**
   * 기본 명령어 가져오기 (오류 상황에서 사용)
   * @returns 기본 명령어
   */
  getDefaultCommand() {
    switch (this.pluginId) {
      case "git":
        return "status";
      case "jira":
        return "list";
      case "swdp":
        return "status";
      case "pocket":
        return "ls";
      default:
        return "help";
    }
  }
  /**
   * 자연어 명령어 처리 유틸리티 메서드 제공
   */
  /**
   * 커밋 메시지 추출 유틸리티
   * @param input 자연어 입력
   * @returns 추출된 커밋 메시지
   */
  static extractCommitMessage(input) {
    const messageMatch = input.match(/["'](.+?)["']|메시지\s*[:\s]\s*(.+?)(?:\s|$)/i);
    if (messageMatch) {
      return messageMatch[1] || messageMatch[2];
    }
    return null;
  }
  /**
   * 파일 경로 추출 유틸리티
   * @param input 자연어 입력
   * @returns 추출된 파일 경로 목록
   */
  static extractFilePaths(input) {
    const fileMatch = input.match(/([./\\a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g);
    return fileMatch || [];
  }
  /**
   * 이슈 ID 추출 유틸리티
   * @param input 자연어 입력
   * @returns 추출된 이슈 ID
   */
  static extractIssueId(input) {
    const issueMatch = input.match(/([A-Z]+-\d+)/);
    return issueMatch ? issueMatch[1] : null;
  }
  /**
   * 숫자 추출 유틸리티
   * @param input 자연어 입력
   * @returns 추출된 숫자
   */
  static extractNumber(input) {
    const numberMatch = input.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[1], 10) : null;
  }
};

// src/plugins/internal/swdp/SwdpNaturalLanguageService.ts
var SwdpNaturalLanguageService = class extends PluginNaturalLanguageService {
  /**
   * SWDP 자연어 처리 서비스 생성자
   * @param swdpDomainService SWDP 도메인 서비스 (선택적)
   * @param swdpWorkflowService SWDP 워크플로우 서비스 (선택적)
   * @param configService 설정 서비스 (선택적)
   * @param userAuthService 사용자 인증 서비스 (선택적)
   */
  constructor(swdpDomainService, swdpWorkflowService, configService, userAuthService) {
    super("swdp");
    this.swdpDomainService = swdpDomainService || SwdpDomainService.getInstance();
    this.swdpWorkflowService = swdpWorkflowService || SwdpWorkflowService.getInstance();
    this.configService = configService || ConfigService.getInstance();
    this.userAuthService = userAuthService || UserAuthService.getInstance();
  }
  /**
   * 자연어 질문을 SWDP 명령어로 변환
   * @param question 사용자 질문
   * @returns SWDP 명령어 또는 null (처리할 수 없는 경우)
   */
  async processNaturalLanguage(question) {
    const normalizedQuestion = question.trim().toLowerCase();
    if (this.isProjectRelatedQuestion(normalizedQuestion)) {
      return this.processProjectQuestion(normalizedQuestion);
    }
    if (this.isTaskRelatedQuestion(normalizedQuestion)) {
      return this.processTaskQuestion(normalizedQuestion);
    }
    if (this.isBuildRelatedQuestion(normalizedQuestion)) {
      return this.processBuildQuestion(normalizedQuestion);
    }
    if (this.isDocumentRelatedQuestion(normalizedQuestion)) {
      return this.processDocumentQuestion(normalizedQuestion);
    }
    return null;
  }
  /**
   * 프로젝트 관련 질문인지 확인
   * @param question 질문
   * @returns 프로젝트 관련 여부
   */
  isProjectRelatedQuestion(question) {
    const projectKeywords = [
      "\uD504\uB85C\uC81D\uD2B8",
      "\uD504\uB85C\uC81D\uD2B8 \uBAA9\uB85D",
      "\uD504\uB85C\uC81D\uD2B8 \uB9AC\uC2A4\uD2B8",
      "\uD504\uB85C\uC81D\uD2B8 \uC815\uBCF4",
      "project",
      "projects",
      "project list",
      "project info"
    ];
    return projectKeywords.some((keyword) => question.includes(keyword));
  }
  /**
   * 작업 관련 질문인지 확인
   * @param question 질문
   * @returns 작업 관련 여부
   */
  isTaskRelatedQuestion(question) {
    const taskKeywords = [
      "\uC791\uC5C5",
      "\uC791\uC5C5 \uBAA9\uB85D",
      "\uC791\uC5C5 \uB9AC\uC2A4\uD2B8",
      "\uC791\uC5C5 \uC815\uBCF4",
      "\uD0DC\uC2A4\uD06C",
      "task",
      "tasks",
      "task list",
      "task info"
    ];
    return taskKeywords.some((keyword) => question.includes(keyword));
  }
  /**
   * 빌드 관련 질문인지 확인
   * @param question 질문
   * @returns 빌드 관련 여부
   */
  isBuildRelatedQuestion(question) {
    const buildKeywords = [
      "\uBE4C\uB4DC",
      "\uBE4C\uB4DC \uC2DC\uC791",
      "\uBE4C\uB4DC \uC0C1\uD0DC",
      "\uBE4C\uB4DC \uB85C\uADF8",
      "\uBE4C\uB4DC \uCDE8\uC18C",
      "build",
      "build start",
      "build status",
      "build log",
      "build cancel"
    ];
    return buildKeywords.some((keyword) => question.includes(keyword));
  }
  /**
   * 문서 관련 질문인지 확인
   * @param question 질문
   * @returns 문서 관련 여부
   */
  isDocumentRelatedQuestion(question) {
    const documentKeywords = [
      "\uBB38\uC11C",
      "\uBB38\uC11C \uBAA9\uB85D",
      "\uBB38\uC11C \uB9AC\uC2A4\uD2B8",
      "\uBB38\uC11C \uC815\uBCF4",
      "\uB3C4\uD050\uBA3C\uD2B8",
      "document",
      "documents",
      "document list",
      "document info"
    ];
    return documentKeywords.some((keyword) => question.includes(keyword));
  }
  /**
   * 프로젝트 관련 질문 처리
   * @param question 질문
   * @returns SWDP 명령어
   */
  processProjectQuestion(question) {
    if (question.includes("\uBAA9\uB85D") || question.includes("\uB9AC\uC2A4\uD2B8") || question.includes("list") || question.match(/프로젝트(\s+)?$/) || question.match(/projects?(\s+)?$/)) {
      return "@swdp:projects";
    }
    const projectCodeMatch = question.match(/프로젝트\s+정보\s+(\w+)/) || question.match(/프로젝트\s+(\w+)/) || question.match(/project\s+info\s+(\w+)/) || question.match(/project\s+(\w+)/);
    if (projectCodeMatch) {
      return `@swdp:project ${projectCodeMatch[1]}`;
    }
    const setProjectMatch = question.match(/프로젝트\s+설정\s+(\w+)/) || question.match(/프로젝트\s+선택\s+(\w+)/) || question.match(/set\s+project\s+(\w+)/);
    if (setProjectMatch) {
      return `@swdp:set-project ${setProjectMatch[1]}`;
    }
    return "@swdp:projects";
  }
  /**
   * 작업 관련 질문 처리
   * @param question 질문
   * @returns SWDP 명령어
   */
  processTaskQuestion(question) {
    if (question.includes("\uBAA9\uB85D") || question.includes("\uB9AC\uC2A4\uD2B8") || question.includes("list") || question.match(/작업(\s+)?$/) || question.match(/tasks?(\s+)?$/)) {
      const projectCodeMatch = question.match(/프로젝트\s+(\w+)/) || question.match(/project\s+(\w+)/);
      return projectCodeMatch ? `@swdp:tasks ${projectCodeMatch[1]}` : "@swdp:tasks";
    }
    const taskIdMatch = question.match(/작업\s+정보\s+(\w+)/) || question.match(/작업\s+(\w+)/) || question.match(/task\s+info\s+(\w+)/) || question.match(/task\s+(\w+)/);
    if (taskIdMatch) {
      return `@swdp:task ${taskIdMatch[1]}`;
    }
    if (question.includes("\uC0DD\uC131") || question.includes("\uCD94\uAC00") || question.includes("create") || question.includes("add")) {
      const titleMatch = question.match(/"([^"]+)"/) || question.match(/'([^']+)'/);
      const descriptionMatch = question.match(/내용[은|이]?\s+"([^"]+)"/) || question.match(/내용[은|이]?\s+'([^']+)'/) || question.match(/description\s+"([^"]+)"/) || question.match(/description\s+'([^']+)'/);
      if (titleMatch) {
        const title = titleMatch[1];
        const description = descriptionMatch ? descriptionMatch[1] : "\uC790\uB3D9 \uC0DD\uC131\uB41C \uC791\uC5C5";
        const projectCodeMatch = question.match(/프로젝트\s+(\w+)/) || question.match(/project\s+(\w+)/);
        return projectCodeMatch ? `@swdp:create-task "${title}" "${description}" ${projectCodeMatch[1]}` : `@swdp:create-task "${title}" "${description}"`;
      }
    }
    if (question.includes("\uC0C1\uD0DC") || question.includes("\uC5C5\uB370\uC774\uD2B8") || question.includes("\uBCC0\uACBD") || question.includes("update") || question.includes("status") || question.includes("change")) {
      const taskIdMatch2 = question.match(/작업\s+(\w+)/) || question.match(/task\s+(\w+)/);
      const statusMatch = question.match(/상태[를|을]?\s+(\w+)/) || question.match(/status\s+(\w+)/);
      if (taskIdMatch2 && statusMatch) {
        return `@swdp:update-task ${taskIdMatch2[1]} ${statusMatch[1]}`;
      }
    }
    return "@swdp:tasks";
  }
  /**
   * 빌드 관련 질문 처리
   * @param question 질문
   * @returns SWDP 명령어
   */
  processBuildQuestion(question) {
    if (question.includes("\uC2DC\uC791") || question.includes("\uC2E4\uD589") || question.includes("start") || question.includes("run")) {
      let buildType = "local";
      if (question.includes("\uC804\uCCB4") || question.includes("all")) {
        buildType = "all";
      } else if (question.includes("\uD1B5\uD569") || question.includes("integration")) {
        buildType = "integration";
      } else if (question.includes("\uB808\uC774\uC5B4") || question.includes("layer")) {
        buildType = "layer";
      }
      const options = [];
      if (question.includes("\uC6CC\uCE58") || question.includes("watch")) {
        options.push("--watch");
      }
      if (question.includes("pr") || question.includes("pull request")) {
        options.push("--pr");
      }
      return `@swdp:build ${buildType} ${options.join(" ")}`.trim();
    }
    if (question.includes("\uC0C1\uD0DC") || question.includes("status")) {
      const buildIdMatch = question.match(/빌드\s+(\w+)/) || question.match(/build\s+(\w+)/);
      return buildIdMatch ? `@swdp:build:status ${buildIdMatch[1]}` : "@swdp:build:status";
    }
    if (question.includes("\uB85C\uADF8") || question.includes("log")) {
      const buildIdMatch = question.match(/빌드\s+(\w+)/) || question.match(/build\s+(\w+)/);
      if (buildIdMatch) {
        return `@swdp:build:logs ${buildIdMatch[1]}`;
      }
    }
    if (question.includes("\uCDE8\uC18C") || question.includes("\uC911\uB2E8") || question.includes("cancel") || question.includes("stop")) {
      const buildIdMatch = question.match(/빌드\s+(\w+)/) || question.match(/build\s+(\w+)/);
      if (buildIdMatch) {
        return `@swdp:build:cancel ${buildIdMatch[1]}`;
      }
    }
    return "@swdp:build:status";
  }
  /**
   * 문서 관련 질문 처리
   * @param question 질문
   * @returns SWDP 명령어
   */
  processDocumentQuestion(question) {
    if (question.includes("\uBAA9\uB85D") || question.includes("\uB9AC\uC2A4\uD2B8") || question.includes("list") || question.match(/문서(\s+)?$/) || question.match(/documents?(\s+)?$/)) {
      const projectCodeMatch = question.match(/프로젝트\s+(\w+)/) || question.match(/project\s+(\w+)/);
      return projectCodeMatch ? `@swdp:documents ${projectCodeMatch[1]}` : "@swdp:documents";
    }
    const docIdMatch = question.match(/문서\s+정보\s+(\w+)/) || question.match(/문서\s+(\w+)/) || question.match(/document\s+info\s+(\w+)/) || question.match(/document\s+(\w+)/);
    if (docIdMatch) {
      return `@swdp:document ${docIdMatch[1]}`;
    }
    if (question.includes("\uC0DD\uC131") || question.includes("\uCD94\uAC00") || question.includes("create") || question.includes("add")) {
      const titleMatch = question.match(/"([^"]+)"/) || question.match(/'([^']+)'/);
      const typeMatch = question.match(/타입[은|이]?\s+(\w+)/) || question.match(/유형[은|이]?\s+(\w+)/) || question.match(/type\s+(\w+)/);
      if (titleMatch && typeMatch) {
        const title = titleMatch[1];
        const type = typeMatch[1];
        const contentMatch = question.match(/내용[은|이]?\s+"([^"]+)"/) || question.match(/내용[은|이]?\s+'([^']+)'/) || question.match(/content\s+"([^"]+)"/) || question.match(/content\s+'([^']+)'/);
        const content = contentMatch ? contentMatch[1] : "# " + title + "\n\n\uC790\uB3D9 \uC0DD\uC131\uB41C \uBB38\uC11C";
        const projectCodeMatch = question.match(/프로젝트\s+(\w+)/) || question.match(/project\s+(\w+)/);
        return projectCodeMatch ? `@swdp:create-document "${title}" "${type}" "${content}" ${projectCodeMatch[1]}` : `@swdp:create-document "${title}" "${type}" "${content}"`;
      }
    }
    return "@swdp:documents";
  }
  /**
   * 이 플러그인이 질문을 처리할 수 있는지 확인
   * @param question 사용자 질문
   * @returns 처리 가능 여부
   */
  canProcessQuestion(question) {
    const normalizedQuestion = question.trim().toLowerCase();
    const swdpKeywords = [
      "swdp",
      "\uD504\uB85C\uC81D\uD2B8",
      "\uC791\uC5C5",
      "\uBE4C\uB4DC",
      "\uBB38\uC11C",
      "\uD0DC\uC2A4\uD06C",
      "project",
      "task",
      "build",
      "document"
    ];
    return swdpKeywords.some((keyword) => normalizedQuestion.includes(keyword));
  }
  /**
   * 도움말 생성
   * @returns 도움말 문자열
   */
  getHelp() {
    return `
# SWDP \uBA85\uB839\uC5B4 \uB3C4\uC6C0\uB9D0

## \uD504\uB85C\uC81D\uD2B8 \uAD00\uB828 \uBA85\uB839\uC5B4
- @swdp:projects - \uD504\uB85C\uC81D\uD2B8 \uBAA9\uB85D \uC870\uD68C
- @swdp:project <project_code> - \uD504\uB85C\uC81D\uD2B8 \uC138\uBD80 \uC815\uBCF4 \uC870\uD68C
- @swdp:set-project <project_code> - \uD604\uC7AC \uC791\uC5C5 \uD504\uB85C\uC81D\uD2B8 \uC124\uC815

## \uC791\uC5C5 \uAD00\uB828 \uBA85\uB839\uC5B4
- @swdp:tasks [project_code] - \uC791\uC5C5 \uBAA9\uB85D \uC870\uD68C
- @swdp:task <task_id> - \uC791\uC5C5 \uC138\uBD80 \uC815\uBCF4 \uC870\uD68C
- @swdp:create-task <title> <description> [project_code] - \uC0C8 \uC791\uC5C5 \uC0DD\uC131
- @swdp:update-task <task_id> <status> - \uC791\uC5C5 \uC0C1\uD0DC \uC5C5\uB370\uC774\uD2B8

## \uBE4C\uB4DC \uAD00\uB828 \uBA85\uB839\uC5B4
- @swdp:build [type] [--watch] [--pr] - \uBE4C\uB4DC \uC2DC\uC791
- @swdp:build:status [buildId] - \uBE4C\uB4DC \uC0C1\uD0DC \uD655\uC778
- @swdp:build:logs <buildId> - \uBE4C\uB4DC \uB85C\uADF8 \uD655\uC778
- @swdp:build:cancel <buildId> - \uBE4C\uB4DC \uCDE8\uC18C

## \uBB38\uC11C \uAD00\uB828 \uBA85\uB839\uC5B4
- @swdp:documents [project_code] - \uBB38\uC11C \uBAA9\uB85D \uC870\uD68C
- @swdp:document <doc_id> - \uBB38\uC11C \uC138\uBD80 \uC815\uBCF4 \uC870\uD68C
- @swdp:create-document <title> <type> <content> [project_code] - \uC0C8 \uBB38\uC11C \uC0DD\uC131

\uC790\uC5F0\uC5B4 \uC608\uC2DC:
- "SWDP \uD504\uB85C\uC81D\uD2B8 \uBAA9\uB85D \uBCF4\uC5EC\uC918"
- "\uD504\uB85C\uC81D\uD2B8 PRJ001 \uC815\uBCF4 \uC54C\uB824\uC918"
- "\uD604\uC7AC \uD504\uB85C\uC81D\uD2B8\uB97C PRJ001\uB85C \uC124\uC815\uD574\uC918"
- "\uC791\uC5C5 \uBAA9\uB85D \uBCF4\uC5EC\uC918"
- "\uC791\uC5C5 TASK001 \uC0C1\uD0DC\uB97C in_progress\uB85C \uBCC0\uACBD\uD574\uC918"
- "\uBE4C\uB4DC \uC2DC\uC791\uD574\uC918 (local)"
- "\uBB38\uC11C \uBAA9\uB85D \uBCF4\uC5EC\uC918"
    `.trim();
  }
};

// src/core/CoreService.ts
var CoreService = class extends import_events7.EventEmitter {
  /**
   * CoreService 생성자
   * 모든 서비스 초기화
   * @param context VS Code 확장 컨텍스트
   */
  constructor(context) {
    super();
    this.context = context;
    this._isEnabled = false;
    this._logger = new LoggerService();
    this._configService = ConfigService.createInstance(context);
    this._commandParser = new CommandParserService();
    this._httpService = new HttpClientService();
    this._vsCodeService = new VSCodeService(context);
    this._userAuthService = UserAuthService.createInstance(this._configService);
    this._pluginRegistry = new PluginRegistryService(this._configService);
    this._commandRegistry = new CommandRegistryService(this._pluginRegistry);
    this._commandExecutor = new CommandExecutorService(
      this._commandRegistry,
      this._pluginRegistry
    );
    this._commandService = new CommandService(this._configService, this);
    this._llmService = new LlmService();
    this._rulesEngine = new RulesEngineService();
    this._promptAssembler = new PromptAssemblerService(this._rulesEngine);
    this._swdpDomainService = SwdpDomainService.createInstance(
      this._configService,
      this._userAuthService
    );
    this._swdpWorkflowService = SwdpWorkflowService.createInstance(
      this._configService,
      this._userAuthService,
      this._swdpDomainService
    );
    this._swdpNaturalLanguageService = new SwdpNaturalLanguageService(
      this._swdpDomainService,
      this._swdpWorkflowService,
      this._configService,
      this._userAuthService
    );
    this.registerServices();
  }
  /**
   * 코어 서비스 인스턴스 생성 팩토리 함수
   * @param context VS Code 확장 컨텍스트
   * @returns 코어 서비스 인스턴스
   */
  static createInstance(context) {
    return new CoreService(context);
  }
  /**
   * 서비스 DI 컨테이너에 등록
   */
  registerServices() {
    container.register("coreService", this);
    container.register("configService", this._configService);
    container.register("commandParser", this._commandParser);
    container.register("commandRegistry", this._commandRegistry);
    container.register("commandExecutor", this._commandExecutor);
    container.register("commandService", this._commandService);
    container.register("pluginRegistry", this._pluginRegistry);
    container.register("llmService", this._llmService);
    container.register("vsCodeService", this._vsCodeService);
    container.register("httpService", this._httpService);
    container.register("promptAssembler", this._promptAssembler);
    container.register("rulesEngine", this._rulesEngine);
    container.register("logger", this._logger);
    container.register("userAuthService", this._userAuthService);
    container.register("swdpDomainService", this._swdpDomainService);
    container.register("swdpWorkflowService", this._swdpWorkflowService);
    container.register("swdpNaturalLanguageService", this._swdpNaturalLanguageService);
  }
  /**
   * 코어 서비스 초기화
   * 모든 하위 서비스 및 플러그인 초기화
   * @returns 초기화 성공 여부
   */
  async initialize() {
    try {
      this._logger.info("APE \uCF54\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC2DC\uC791");
      try {
        this._logger.info("\uC124\uC815 \uB85C\uB4DC \uC2DC\uC791");
        const loadSuccess = await this._configService.load(true);
        if (!loadSuccess) {
          this._logger.warn("\uC124\uC815 \uB85C\uB4DC \uC2E4\uD328, \uAE30\uBCF8 \uC124\uC815 \uC0AC\uC6A9");
        } else {
          this._logger.info("\uC124\uC815 \uB85C\uB4DC \uC131\uACF5");
        }
        try {
          if (typeof this._configService.validate === "function") {
            const configValid = await this._configService.validate(this._configService.getCoreConfig(), true);
            if (!configValid) {
              this._logger.error("\uC124\uC815 \uAC80\uC99D \uC2E4\uD328");
              this._logger.info("\uC124\uC815 \uC624\uB958 \uBB34\uC2DC\uD558\uACE0 \uC9C4\uD589 (\uAC1C\uBC1C \uBAA8\uB4DC)");
            } else {
              this._logger.info("\uC124\uC815 \uAC80\uC99D \uC131\uACF5");
            }
          } else {
            this._logger.warn("\uC124\uC815 \uAC80\uC99D \uBA54\uC11C\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uAC80\uC99D \uB2E8\uACC4 \uAC74\uB108\uB701\uB2C8\uB2E4.");
          }
        } catch (validationError) {
          this._logger.error("\uC124\uC815 \uAC80\uC99D \uBA54\uC11C\uB4DC \uD638\uCD9C \uC911 \uC624\uB958:", validationError);
          this._logger.info("\uC124\uC815 \uAC80\uC99D \uC624\uB958 \uBB34\uC2DC\uD558\uACE0 \uC9C4\uD589 (\uAC1C\uBC1C \uBAA8\uB4DC)");
        }
      } catch (configError) {
        this._logger.error("\uC124\uC815 \uAC80\uC99D \uC911 \uC624\uB958:", configError);
        this._logger.error("\uC0C1\uC138 \uC624\uB958 \uC815\uBCF4:", JSON.stringify(configError, Object.getOwnPropertyNames(configError)));
        this._logger.info("\uC124\uC815 \uC624\uB958 \uBB34\uC2DC\uD558\uACE0 \uC9C4\uD589...");
      }
      try {
        this._logger.info("SSL \uC6B0\uD68C \uC124\uC815 \uC801\uC6A9 \uC2DC\uC791");
        const coreConfig = this._configService.getCoreConfig();
        const sslBypassEnabled = coreConfig.sslBypass || this._configService.get("core.sslBypass", false);
        this._httpService.setSSLBypass(sslBypassEnabled);
        this._logger.info(`SSL \uC6B0\uD68C \uC124\uC815 \uC801\uC6A9 \uC644\uB8CC: ${sslBypassEnabled ? "\uC0AC\uC6A9" : "\uC0AC\uC6A9 \uC548 \uD568"}`);
      } catch (sslError) {
        this._logger.error("SSL \uC6B0\uD68C \uC124\uC815 \uC801\uC6A9 \uC911 \uC624\uB958:", sslError);
      }
      try {
        this._logger.info("\uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2DC\uC791");
        const pluginCount = await this.registerInternalPlugins();
        this._logger.info(`${pluginCount}\uAC1C\uC758 \uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC644\uB8CC`);
      } catch (pluginError) {
        this._logger.error("\uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC911 \uC624\uB958:", pluginError);
        this._logger.error("\uC0C1\uC138 \uC624\uB958 \uC815\uBCF4:", JSON.stringify(pluginError, Object.getOwnPropertyNames(pluginError)));
        this._logger.info("\uD50C\uB7EC\uADF8\uC778 \uC624\uB958 \uBB34\uC2DC\uD558\uACE0 \uC9C4\uD589...");
      }
      try {
        this._logger.info("\uD50C\uB7EC\uADF8\uC778 \uCD08\uAE30\uD654 \uC2DC\uC791");
        await this._pluginRegistry.initialize();
        this._logger.info("\uD50C\uB7EC\uADF8\uC778 \uCD08\uAE30\uD654 \uC644\uB8CC");
      } catch (initError) {
        this._logger.error("\uD50C\uB7EC\uADF8\uC778 \uCD08\uAE30\uD654 \uC911 \uC624\uB958:", initError);
        this._logger.error("\uC0C1\uC138 \uC624\uB958 \uC815\uBCF4:", JSON.stringify(initError, Object.getOwnPropertyNames(initError)));
        this._logger.info("\uCD08\uAE30\uD654 \uC624\uB958 \uBB34\uC2DC\uD558\uACE0 \uC9C4\uD589...");
      }
      try {
        this._logger.info("\uCEE8\uD14D\uC2A4\uD2B8 \uAE30\uBC18 \uBA85\uB839\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC2DC\uC791");
        await this._commandService.initialize();
        this._logger.info("\uCEE8\uD14D\uC2A4\uD2B8 \uAE30\uBC18 \uBA85\uB839\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC644\uB8CC");
      } catch (commandServiceError) {
        const errorMessage = commandServiceError instanceof Error ? commandServiceError.message : typeof commandServiceError === "string" ? commandServiceError : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958";
        this._logger.error("\uCEE8\uD14D\uC2A4\uD2B8 \uAE30\uBC18 \uBA85\uB839\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC911 \uC624\uB958:", errorMessage);
        this._logger.info("\uBA85\uB839\uC5B4 \uC11C\uBE44\uC2A4 \uC624\uB958 \uBB34\uC2DC\uD558\uACE0 \uC9C4\uD589...");
      }
      this._isEnabled = true;
      this.emit("core-initialized");
      this._logger.info("APE \uCF54\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC131\uACF5");
      return true;
    } catch (error) {
      this._logger.error("APE \uCF54\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC2E4\uD328:", error);
      this._logger.error("\uC0C1\uC138 \uC624\uB958 \uC815\uBCF4:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error("APE \uCF54\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC2E4\uD328 \uC0C1\uC138 \uC815\uBCF4:", error);
      this._logger.info("\uC624\uB958 \uBC1C\uC0DD\uC73C\uB85C \uC81C\uD55C \uBAA8\uB4DC\uB85C \uC804\uD658\uD569\uB2C8\uB2E4.");
      this._isEnabled = true;
      return true;
    }
  }
  /**
   * 내부 플러그인 등록
   * @returns 등록된 플러그인 수
   */
  async registerInternalPlugins() {
    try {
      this._logger.info("\uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2DC\uC791");
      let count = 0;
      const internalPluginsPath = "../plugins/internal";
      this._logger.info(`\uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uBAA8\uB4C8 \uACBD\uB85C: ${internalPluginsPath}`);
      try {
        const internalPlugins = await import(internalPluginsPath);
        this._logger.info("\uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uBAA8\uB4C8 \uB85C\uB529 \uC131\uACF5:", Object.keys(internalPlugins));
        try {
          this._logger.info("Git \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2DC\uB3C4 \uC911...");
          const GitPluginService = internalPlugins.GitPluginService;
          if (!GitPluginService) {
            this._logger.error("GitPluginService\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
          } else {
            const gitPlugin = new GitPluginService(this._configService, this._llmService);
            if (this._pluginRegistry.registerPlugin(gitPlugin, "internal")) {
              count++;
              this._logger.info(`Git \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC131\uACF5: ${gitPlugin.name} (${gitPlugin.id})`);
            }
          }
        } catch (gitError) {
          this._logger.error("Git \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2E4\uD328:", gitError);
        }
        try {
          this._logger.info("Jira \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2DC\uB3C4 \uC911...");
          const JiraPluginService = internalPlugins.JiraPluginService;
          if (!JiraPluginService) {
            this._logger.error("JiraPluginService\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
          } else {
            const jiraPlugin = new JiraPluginService(this._configService);
            if (this._pluginRegistry.registerPlugin(jiraPlugin, "internal")) {
              count++;
              this._logger.info(`Jira \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC131\uACF5: ${jiraPlugin.name} (${jiraPlugin.id})`);
            }
          }
        } catch (jiraError) {
          this._logger.error("Jira \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2E4\uD328:", jiraError);
        }
        try {
          this._logger.info("SWDP \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2DC\uB3C4 \uC911...");
          const SwdpPluginService = internalPlugins.SwdpPluginService;
          if (!SwdpPluginService) {
            this._logger.error("SwdpPluginService\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
          } else {
            const swdpPlugin = new SwdpPluginService(
              this._configService,
              this._swdpDomainService,
              this._swdpWorkflowService,
              this._swdpNaturalLanguageService
            );
            if (this._pluginRegistry.registerPlugin(swdpPlugin, "internal")) {
              count++;
              this._logger.info(`SWDP \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC131\uACF5: ${swdpPlugin.name} (${swdpPlugin.id})`);
            }
          }
        } catch (swdpError) {
          this._logger.error("SWDP \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2E4\uD328:", swdpError);
        }
        try {
          this._logger.info("Pocket \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2DC\uB3C4 \uC911...");
          const PocketPluginService = internalPlugins.PocketPluginService;
          if (!PocketPluginService) {
            this._logger.error("PocketPluginService\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
          } else {
            const pocketPlugin = new PocketPluginService(
              this._configService,
              this._llmService
            );
            if (this._pluginRegistry.registerPlugin(pocketPlugin, "internal")) {
              count++;
              this._logger.info(`Pocket \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC131\uACF5: ${pocketPlugin.name} (${pocketPlugin.id})`);
            }
          }
        } catch (pocketError) {
          this._logger.error("Pocket \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC2E4\uD328:", pocketError);
        }
        this._logger.info(`\uCD1D ${count}\uAC1C\uC758 \uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D\uB428`);
        return count;
      } catch (importError) {
        this._logger.error("\uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uBAA8\uB4C8 \uB85C\uB529 \uC2E4\uD328:", importError);
        this._logger.error("\uC0C1\uC138 \uC624\uB958 \uC815\uBCF4:", JSON.stringify(importError, Object.getOwnPropertyNames(importError)));
        this._logger.info("\uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uC5C6\uC774 \uC9C4\uD589\uD569\uB2C8\uB2E4.");
        return 0;
      }
    } catch (error) {
      this._logger.error("\uB0B4\uBD80 \uD50C\uB7EC\uADF8\uC778 \uB4F1\uB85D \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this._logger.error("\uC0C1\uC138 \uC624\uB958 \uC815\uBCF4:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return 0;
    }
  }
  /**
   * 사용자 메시지 처리
   * 명령어 파싱 및 실행
   * @param text 사용자 입력 텍스트
   * @param options 처리 옵션 (스트리밍 및 대화 맥락 등)
   * @returns 처리 결과
   */
  async processMessage(text, options) {
    try {
      this._logger.info(`\uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC2DC\uC791: "${text}"`);
      const command = this._commandParser.parse(text);
      if (command) {
        this._logger.info(`\uBA85\uB839\uC5B4 \uAC10\uC9C0\uB428: ${command.prefix}${command.agentId}:${command.command}`);
        try {
          const result = await this.executeCommand(command);
          this._logger.info("\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC131\uACF5");
          return result;
        } catch (cmdError) {
          this._logger.error(`\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC2E4\uD328: ${cmdError}`);
          const errorMessage = cmdError instanceof Error ? cmdError.message : String(cmdError);
          return {
            content: `# \uBA85\uB839\uC5B4 \uC2E4\uD589 \uC624\uB958

\`${command.prefix}${command.agentId}:${command.command}\`

\uC624\uB958: ${errorMessage}`,
            error: true
          };
        }
      }
      if (text.trim().toLowerCase() === "debug") {
        return {
          content: "# \uB514\uBC84\uADF8 \uBAA8\uB4DC \uD65C\uC131\uD654\n\n\uD604\uC7AC \uC2DC\uAC04: " + (/* @__PURE__ */ new Date()).toLocaleString() + `

\uB4F1\uB85D\uB41C \uBA85\uB839\uC5B4: ${this._commandRegistry.getAllCommandUsages().length}\uAC1C
\uB4F1\uB85D\uB41C \uD50C\uB7EC\uADF8\uC778: ${this._pluginRegistry.getEnabledPlugins().length}\uAC1C`
        };
      }
      this._logger.info(`\uC77C\uBC18 \uD14D\uC2A4\uD2B8\uB85C \uCC98\uB9AC: LLM \uC751\uB2F5 \uC0DD\uC131 (\uC2A4\uD2B8\uB9AC\uBC0D: ${options?.stream ? "\uCF1C\uC9D0" : "\uAEBC\uC9D0"})`);
      if (options?.embedDevMode) {
        this._logger.info(`\uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC \uD65C\uC131\uD654: \uACE0\uAE09 \uD504\uB86C\uD504\uD2B8 \uC5D4\uC9C0\uB2C8\uC5B4\uB9C1 \uBC0F \uB0B4\uBD80 \uB370\uC774\uD130 \uBD84\uC11D \uC801\uC6A9`);
      }
      if (options?.conversationHistory) {
        this._logger.info(`\uB300\uD654 \uB9E5\uB77D \uD3EC\uD568: ${options.conversationHistory.length}\uAC1C\uC758 \uBA54\uC2DC\uC9C0`);
      }
      if (options?.stream && options?.onUpdate) {
        return await this.generateStreamingResponse(text, options.onUpdate, options.conversationHistory, options);
      } else {
        return await this.generateResponse(text, options?.conversationHistory, options);
      }
    } catch (error) {
      this._logger.error("\uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return {
        content: `\uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`,
        error: true
      };
    }
  }
  /**
   * 스트리밍 응답 생성
   * @param text 사용자 입력 텍스트
   * @param onUpdate 스트리밍 업데이트 콜백
   * @param conversationHistory 대화 맥락 (선택 사항)
   * @returns 생성된 응답
   */
  async generateStreamingResponse(text, onUpdate, conversationHistory, options) {
    try {
      const promptData = await this._promptAssembler.assemblePrompt(text);
      if (conversationHistory && conversationHistory.length > 0) {
        const systemMessages = promptData.messages.filter((m) => m.role === "system");
        const typedContextMessages = this.ensureChatMessageArray(conversationHistory);
        const hasCurrentUserMessage = typedContextMessages.some(
          (m) => m.role === "user" && m.content === text
        );
        if (!hasCurrentUserMessage) {
          typedContextMessages.push(this.createChatMessage("user", text));
        }
        promptData.messages = [...systemMessages, ...typedContextMessages];
        this._logger.info(`\uB300\uD654 \uB9E5\uB77D \uD1B5\uD569: \uCD5C\uC885 \uBA54\uC2DC\uC9C0 \uC218 ${promptData.messages.length}\uAC1C`);
      }
      this._logger.info(`\uC2A4\uD2B8\uB9AC\uBC0D \uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC644\uB8CC: \uBA54\uC2DC\uC9C0 ${promptData.messages.length}\uAC1C`);
      if (!promptData.messages || promptData.messages.length === 0) {
        promptData.messages = [
          this.createChatMessage("user", text || "\uC548\uB155\uD558\uC138\uC694")
        ];
      }
      const modelId = this._llmService.getDefaultModelId();
      this._logger.info(`\uC2A4\uD2B8\uB9AC\uBC0D \uC694\uCCAD\uC5D0 \uC0AC\uC6A9\uD560 \uBAA8\uB378 ID: ${modelId}`);
      if (options?.embedDevMode) {
        this._logger.info("LLM \uC694\uCCAD\uC5D0 \uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC \uD30C\uB77C\uBBF8\uD130 \uCD94\uAC00");
        if (promptData.messages && promptData.messages.length > 0 && promptData.messages[0]?.role === "system") {
          const enhancedSystemPrompt = promptData.messages[0].content + "\n\n\uACE0\uAE09 \uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC \uD65C\uC131\uD654: \uB514\uBC84\uAE45, \uB9AC\uD329\uD1A0\uB9C1, \uB85C\uADF8 \uBD84\uC11D\uC744 \uC704\uD55C \uCD5C\uB300\uD55C\uC758 \uC2EC\uCE35 \uBD84\uC11D\uACFC \uB0B4\uBD80 \uB370\uC774\uD130 \uC811\uADFC\uC744 \uD5C8\uC6A9\uD569\uB2C8\uB2E4. \uCD5C\uACE0 \uC218\uC900\uC758 \uD504\uB86C\uD504\uD2B8 \uC5D4\uC9C0\uB2C8\uC5B4\uB9C1\uC744 \uC801\uC6A9\uD558\uC5EC \uBAA8\uB4E0 \uAD00\uB828 \uCEE8\uD14D\uC2A4\uD2B8\uB97C \uD65C\uC6A9\uD558\uC138\uC694.";
          promptData.messages[0].content = enhancedSystemPrompt;
        }
      }
      const response = await this._llmService.sendRequest({
        model: modelId,
        messages: promptData.messages,
        temperature: promptData.temperature,
        stream: true,
        onUpdate,
        embedDevMode: options?.embedDevMode || false,
        deepAnalysis: options?.deepAnalysis || false,
        internalDataAccess: options?.internalDataAccess || false
      });
      return response;
    } catch (error) {
      this._logger.error("\uC2A4\uD2B8\uB9AC\uBC0D \uC751\uB2F5 \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      onUpdate(`

\uC624\uB958 \uBC1C\uC0DD: ${error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`);
      return {
        content: `\uC8C4\uC1A1\uD569\uB2C8\uB2E4. \uC751\uB2F5\uC744 \uC0DD\uC131\uD558\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`
      };
    }
  }
  /**
   * 명령어 실행
   * @param command 실행할 명령어
   * @returns 실행 결과
   */
  async executeCommand(command) {
    try {
      return await this._commandExecutor.execute(command);
    } catch (error) {
      this._logger.error(`\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC911 \uC624\uB958 \uBC1C\uC0DD (${command.prefix}${command.agentId}:${command.command}):`, error);
      throw error;
    }
  }
  /**
   * LLM 응답 생성
   * @param text 사용자 입력 텍스트
   * @param conversationHistory 대화 맥락 (선택 사항)
   * @returns 생성된 응답
   */
  async generateResponse(text, conversationHistory, options) {
    try {
      const promptData = await this._promptAssembler.assemblePrompt(text);
      if (conversationHistory && conversationHistory.length > 0) {
        const systemMessages = promptData.messages.filter((m) => m.role === "system");
        const typedContextMessages = this.ensureChatMessageArray(conversationHistory);
        const hasCurrentUserMessage = typedContextMessages.some(
          (m) => m.role === "user" && m.content === text
        );
        if (!hasCurrentUserMessage) {
          typedContextMessages.push(this.createChatMessage("user", text));
        }
        promptData.messages = [...systemMessages, ...typedContextMessages];
        this._logger.info(`\uB300\uD654 \uB9E5\uB77D \uD1B5\uD569: \uCD5C\uC885 \uBA54\uC2DC\uC9C0 \uC218 ${promptData.messages.length}\uAC1C`);
      }
      this._logger.info(`\uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC644\uB8CC: \uBA54\uC2DC\uC9C0 ${promptData.messages.length}\uAC1C, \uC628\uB3C4 ${promptData.temperature}`);
      if (!promptData.messages || promptData.messages.length === 0) {
        promptData.messages = [
          this.createChatMessage("user", text || "\uC548\uB155\uD558\uC138\uC694")
        ];
      }
      if (options?.embedDevMode) {
        this._logger.info("LLM \uC694\uCCAD\uC5D0 \uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC \uD30C\uB77C\uBBF8\uD130 \uCD94\uAC00 (\uBE44\uC2A4\uD2B8\uB9AC\uBC0D \uBAA8\uB4DC)");
        if (promptData.messages && promptData.messages.length > 0 && promptData.messages[0]?.role === "system") {
          const enhancedSystemPrompt = promptData.messages[0].content + "\n\n\uACE0\uAE09 \uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC \uD65C\uC131\uD654: \uB514\uBC84\uAE45, \uB9AC\uD329\uD1A0\uB9C1, \uB85C\uADF8 \uBD84\uC11D\uC744 \uC704\uD55C \uCD5C\uB300\uD55C\uC758 \uC2EC\uCE35 \uBD84\uC11D\uACFC \uB0B4\uBD80 \uB370\uC774\uD130 \uC811\uADFC\uC744 \uD5C8\uC6A9\uD569\uB2C8\uB2E4. \uCD5C\uACE0 \uC218\uC900\uC758 \uD504\uB86C\uD504\uD2B8 \uC5D4\uC9C0\uB2C8\uC5B4\uB9C1\uC744 \uC801\uC6A9\uD558\uC5EC \uBAA8\uB4E0 \uAD00\uB828 \uCEE8\uD14D\uC2A4\uD2B8\uB97C \uD65C\uC6A9\uD558\uC138\uC694.";
          promptData.messages[0].content = enhancedSystemPrompt;
        }
      }
      const response = await this._llmService.sendRequest({
        model: this._llmService.getDefaultModelId(),
        messages: promptData.messages,
        temperature: promptData.temperature,
        embedDevMode: options?.embedDevMode || false,
        deepAnalysis: options?.deepAnalysis || false,
        internalDataAccess: options?.internalDataAccess || false
      });
      return response;
    } catch (error) {
      this._logger.error("\uC751\uB2F5 \uC0DD\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return {
        content: `\uC8C4\uC1A1\uD569\uB2C8\uB2E4. \uC751\uB2F5\uC744 \uC0DD\uC131\uD558\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`
      };
    }
  }
  /**
   * 컨텍스트 정보 수집
   * @returns 컨텍스트 정보
   */
  async collectContext() {
    try {
      const editorContext = await this._vsCodeService.getEditorContext();
      const pluginInfo = this._pluginRegistry.getEnabledPlugins().map((p) => p.id);
      return {
        editor: editorContext,
        plugins: pluginInfo
      };
    } catch (error) {
      this._logger.error("\uCEE8\uD14D\uC2A4\uD2B8 \uC218\uC9D1 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return {};
    }
  }
  /**
   * 메시지 역할 캐스팅 유틸리티 메서드
   * LLM 메시지 역할을 적절한 형식으로 변환
   * @param role 메시지 역할 문자열
   * @returns MessageRole 타입으로 변환된 역할
   */
  ensureMessageRole(role) {
    if (role === "system" || role === "user" || role === "assistant") {
      return role;
    }
    return "user";
  }
  /**
   * 안전한 채팅 메시지 생성
   * @param role 메시지 역할
   * @param content 메시지 내용
   * @returns 타입 안전 채팅 메시지
   */
  createChatMessage(role, content) {
    return {
      role: this.ensureMessageRole(role),
      content
    };
  }
  /**
   * 안전한 메시지 배열 변환
   * @param messages 변환할 메시지 배열
   * @returns 타입 안전 메시지 배열
   */
  ensureChatMessageArray(messages) {
    if (!messages) {
      return [];
    }
    return messages.map((msg) => this.createChatMessage(msg.role, msg.content));
  }
  /**
   * 서비스 활성화 여부
   * @returns 활성화 상태
   */
  isEnabled() {
    return this._isEnabled;
  }
  get configService() {
    return this._configService;
  }
  get commandRegistry() {
    return this._commandRegistry;
  }
  get pluginRegistry() {
    return this._pluginRegistry;
  }
  get llmService() {
    return this._llmService;
  }
  get vsCodeService() {
    return this._vsCodeService;
  }
  get commandService() {
    return this._commandService;
  }
  get httpService() {
    return this._httpService;
  }
  get promptAssembler() {
    return this._promptAssembler;
  }
  get logger() {
    return this._logger;
  }
  get userAuthService() {
    return this._userAuthService;
  }
  get swdpDomainService() {
    return this._swdpDomainService;
  }
  get swdpWorkflowService() {
    return this._swdpWorkflowService;
  }
  get swdpNaturalLanguageService() {
    return this._swdpNaturalLanguageService;
  }
};

// src/ui/ApeChatViewProvider.ts
var vscode5 = __toESM(require("vscode"));
var fs3 = __toESM(require("fs"));
var ApeChatViewProvider = class {
  constructor(_extensionUri, _chatService, _coreService) {
    this._extensionUri = _extensionUri;
    this._chatService = _chatService;
    this._coreService = _coreService;
    this.logger = new LoggerService();
    this.logger.info("ApeChatViewProvider \uC0DD\uC131\uC790 - CoreService \uC9C1\uC811 \uC8FC\uC785\uB428");
  }
  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;
    webviewView.description = "\uCC44\uD305 \uC778\uD130\uD398\uC774\uC2A4";
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.logger.info("\uCC44\uD305 \uC6F9\uBDF0\uAC00 \uD45C\uC2DC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
        this._sendCurrentTheme();
      }
    });
    webviewView.onDidChangeViewState((e) => {
      this.logger.info("\uCC44\uD305 \uC6F9\uBDF0 \uC0C1\uD0DC \uBCC0\uACBD\uB428");
      if (this._view && this._view.visible) {
        this._view.webview.postMessage({
          command: "viewStateChanged",
          isVisible: e.webviewView.visible
        });
      }
    });
    webviewView.webview.html = this._getHtmlContent(webviewView.webview);
    this.logger.info("\uCC44\uD305 \uC6F9\uBDF0 HTML\uC774 \uC124\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    this._registerThemeChangeListener();
    const viewStateChangeEmitter = new vscode5.EventEmitter();
    const onDidChangeViewState = viewStateChangeEmitter.event;
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._sendViewDimensions();
      }
    });
    const resizeInterval = setInterval(() => {
      if (this._view && this._view.visible) {
        this._sendViewDimensions();
      }
    }, 2e3);
    context.subscriptions.push({
      dispose: () => {
        clearInterval(resizeInterval);
      }
    });
    setTimeout(() => {
      if (this._view && this._view.visible) {
        webviewView.webview.postMessage({
          command: "initialized",
          timestamp: Date.now()
        });
        this.logger.info("\uC6F9\uBDF0 \uCD08\uAE30\uD654 \uC644\uB8CC \uBA54\uC2DC\uC9C0 \uC804\uC1A1");
        this._sendViewDimensions();
      }
    }, 1e3);
    webviewView.webview.onDidReceiveMessage((message) => {
      this.logger.info("\uCC44\uD305 \uC6F9\uBDF0\uB85C\uBD80\uD130 \uBA54\uC2DC\uC9C0\uB97C \uBC1B\uC558\uC2B5\uB2C8\uB2E4:", message);
      switch (message.command) {
        case "resizeStart":
          this.logger.info("\uC6F9\uBDF0 \uD06C\uAE30 \uC870\uC808 \uC2DC\uC791");
          return;
        case "resizeEnd":
          this.logger.info("\uC6F9\uBDF0 \uD06C\uAE30 \uC870\uC808 \uC644\uB8CC");
          this._sendViewDimensions();
          return;
        case "sendMessage":
          this._handleUserMessage(message);
          return;
        case "clearChat":
          this.clearChat();
          this._chatService.clearConversation();
          return;
        case "changeModel":
          this._changeModel(message.model);
          return;
        case "getTheme":
          this._sendCurrentTheme();
          return;
        case "getModelList":
          this.logger.info("\uC6F9\uBDF0\uC5D0\uC11C \uBAA8\uB378 \uBAA9\uB85D \uC694\uCCAD \uBC1B\uC74C");
          this._sendModelList();
          this._sendCurrentModel();
          return;
        case "toggleEmbedDevMode":
          this.logger.info(`\uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC: ${message.enabled ? "\uD65C\uC131\uD654" : "\uBE44\uD65C\uC131\uD654"}`);
          vscode5.workspace.getConfiguration("ape.core").update(
            "embedDevMode",
            message.enabled,
            vscode5.ConfigurationTarget.Global
          );
          return;
        case "toggleApeMode":
          this.logger.info(`\uB3C4\uAD6C \uD65C\uC6A9 \uBAA8\uB4DC: ${message.enabled ? "\uD65C\uC131\uD654" : "\uBE44\uD65C\uC131\uD654"}`);
          vscode5.workspace.getConfiguration("ape.ui").update(
            "apeMode",
            message.enabled,
            vscode5.ConfigurationTarget.Global
          );
          const newMode = message.enabled ? "hybrid" : "standard";
          vscode5.workspace.getConfiguration("ape").update(
            "uiMode",
            newMode,
            vscode5.ConfigurationTarget.Global
          );
          vscode5.window.showInformationMessage(`\uB3C4\uAD6C \uD65C\uC6A9 \uBAA8\uB4DC\uAC00 ${message.enabled ? "\uD65C\uC131\uD654" : "\uBE44\uD65C\uC131\uD654"}\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`);
          this.logger.info("\uB3C4\uAD6C \uD65C\uC6A9 \uBAA8\uB4DC \uC124\uC815 \uBCC0\uACBD \uC644\uB8CC");
          return;
        case "getCommands":
          this._sendCommandsList();
          return;
        case "executeCommand":
          this.logger.info("\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC694\uCCAD:", message.commandId);
          if (message.commandId) {
            this._executeCommand(message.commandId);
          }
          return;
        case "copyToClipboard":
          if (message.text) {
            vscode5.env.clipboard.writeText(message.text).then(() => {
              this.logger.info("\uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uB428:", message.text);
            }, (err) => {
              this.logger.error("\uD074\uB9BD\uBCF4\uB4DC \uBCF5\uC0AC \uC624\uB958:", err);
            });
          }
          return;
        case "newChat":
          this.clearChat();
          this._chatService.clearConversation();
          return;
        case "saveAndNewChat":
          this.saveCurrentSession();
          this.clearChat();
          this._chatService.clearConversation();
          return;
        case "saveChatSession":
          this.saveCurrentSession(message.title);
          return;
        case "treeViewAction":
          this._handleTreeViewAction(message);
          return;
        case "changeUiMode":
          this.logger.info(`UI \uBAA8\uB4DC \uBCC0\uACBD \uC694\uCCAD \uC218\uC2E0: ${message.mode}`);
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: "setApeMode",
              enabled: message.mode === "hybrid"
            });
          }
          return;
      }
    });
    setTimeout(() => {
      this._sendModelList();
    }, 500);
    setTimeout(() => {
      this._sendCurrentModel();
    }, 600);
    setTimeout(() => {
      this._sendResponse(this._chatService.getWelcomeMessage(), "assistant");
    }, 1e3);
    setTimeout(() => {
      const config = vscode5.workspace.getConfiguration("ape");
      const currentMode = config.get("uiMode", "standard");
      if (this._view && this._view.visible) {
        this._view.webview.postMessage({
          command: "setApeMode",
          enabled: currentMode === "hybrid"
        });
        this.logger.info(`\uCD08\uAE30 UI \uBAA8\uB4DC \uC124\uC815\uB428: ${currentMode}`);
      }
    }, 1200);
  }
  /**
   * 사용자 메시지 처리
   */
  async _handleUserMessage(message) {
    this.logger.info("\uC0AC\uC6A9\uC790 \uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC2DC\uC791:", message);
    if (!this._view) {
      this.logger.error("\uCC44\uD305 \uBDF0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA54\uC2DC\uC9C0\uB97C \uCC98\uB9AC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const text = message.text;
    const selectedModel = message.model;
    const embedDevMode = message.embedDevMode;
    const useStreaming = true;
    this.logger.info(`\uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC138\uBD80\uC815\uBCF4:
    - \uD14D\uC2A4\uD2B8: ${text}
    - \uC120\uD0DD \uBAA8\uB378: ${selectedModel || "\uAE30\uBCF8\uAC12"}
    - \uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC: ${embedDevMode ? "\uD65C\uC131\uD654" : "\uBE44\uD65C\uC131\uD654"}
    - \uC2A4\uD2B8\uB9AC\uBC0D: ${useStreaming ? "\uC0AC\uC6A9" : "\uBBF8\uC0AC\uC6A9"}`);
    try {
      this._sendResponse("\uC0DD\uAC01 \uC911...", "system");
      if (selectedModel) {
        this._changeModel(selectedModel);
      }
      if (this._view && this._view.visible) {
        this._view.webview.postMessage({
          command: "removeSystemMessage",
          content: "\uC0DD\uAC01 \uC911..."
        });
      }
      const isAtCommand = text.trim().startsWith("@");
      const isSlashCommand = text.trim().startsWith("/");
      if (isAtCommand || isSlashCommand) {
        this.logger.info(`ApeChatViewProvider: ${isAtCommand ? "@" : "/"}\uBA85\uB839\uC5B4 \uAC10\uC9C0 - "${text}"`);
        const commandResponseId = `cmd-${Date.now()}`;
        this._view.webview.postMessage({
          command: "startStreaming",
          responseId: commandResponseId,
          type: "system"
        });
        const commandResponse = await this._chatService.processMessage(text);
        if (commandResponse) {
          let responseContent = "";
          let responseType = "system";
          let hasError = false;
          if (typeof commandResponse === "object" && commandResponse !== null) {
            if (commandResponse && "success" in commandResponse && "message" in commandResponse) {
              const result = commandResponse;
              responseContent = result.message || JSON.stringify(result, null, 2);
              responseType = result.error ? "system" : "assistant";
              hasError = !!result.error;
            } else if (commandResponse && "content" in commandResponse) {
              const content = commandResponse.content;
              hasError = "error" in commandResponse && !!commandResponse.error;
              responseType = hasError ? "system" : "assistant";
              responseContent = content;
            } else {
              responseContent = JSON.stringify(commandResponse, null, 2);
            }
          } else {
            responseContent = String(commandResponse);
          }
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: "endStreaming",
              responseId: commandResponseId
            });
            this._sendResponse(responseContent, responseType);
            this._view.webview.postMessage({
              command: "commandExecuted",
              commandId: text,
              success: !hasError
            });
          }
        }
        return;
      }
      if (useStreaming) {
        let isFirstChunk = true;
        let chunkCount = 0;
        let startTime = Date.now();
        const responseId = `resp-${Date.now()}`;
        this.logger.info(`ApeChatViewProvider: \uC2A4\uD2B8\uB9AC\uBC0D \uC2DC\uC791 - \uC751\uB2F5 ID: ${responseId}`);
        if (embedDevMode) {
          this.logger.info(`\uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC\uB85C \uCC98\uB9AC - \uACE0\uAE09 \uD504\uB86C\uD504\uD2B8 \uC5D4\uC9C0\uB2C8\uC5B4\uB9C1 \uBC0F \uB0B4\uBD80\uB9DD \uB370\uC774\uD130 \uBD84\uC11D \uC801\uC6A9`);
        }
        this._view.webview.postMessage({
          command: "startStreaming",
          responseId,
          type: "assistant"
        });
        const streamHandler = (chunk) => {
          if (!this._view || !this._view.visible)
            return;
          chunkCount++;
          if (isFirstChunk) {
            this.logger.info(`ApeChatViewProvider: \uCCAB \uCCAD\uD06C \uC218\uC2E0 - \uAE38\uC774: ${chunk.length}\uC790`);
            isFirstChunk = false;
          }
          if (chunkCount <= 2 || chunkCount % 50 === 0) {
            this.logger.info(`ApeChatViewProvider: \uC2A4\uD2B8\uB9AC\uBC0D \uCCAD\uD06C #${chunkCount} \uC218\uC2E0 - \uAE38\uC774: ${chunk.length}\uC790`);
          }
          this._view.webview.postMessage({
            command: "appendStreamChunk",
            responseId,
            content: chunk,
            type: "assistant"
          });
        };
        await this._chatService.processMessage(text, streamHandler, { embedDevMode: embedDevMode || false });
        if (this._view && this._view.visible) {
          const endTime = Date.now();
          const duration = (endTime - startTime) / 1e3;
          this.logger.info(`ApeChatViewProvider: \uC2A4\uD2B8\uB9AC\uBC0D \uC644\uB8CC - \uCD1D \uCCAD\uD06C: ${chunkCount}, \uC18C\uC694 \uC2DC\uAC04: ${duration.toFixed(2)}\uCD08`);
          this._view.webview.postMessage({
            command: "endStreaming",
            responseId
          });
        }
      } else {
        const response = await this._chatService.processMessage(text);
        if (response && this._view && this._view.visible) {
          if (typeof response === "object" && response !== null) {
            if (response && "content" in response && response.content) {
              const responseType = response && "error" in response && !!response.error ? "system" : "assistant";
              this._sendResponse(response.content, responseType);
            } else if (response) {
              this._sendResponse(JSON.stringify(response, null, 2), "assistant");
            }
          } else if (typeof response === "string" && response.trim && response.trim() !== "") {
            this._sendResponse(response, "assistant");
          }
        }
      }
    } catch (error) {
      this.logger.error("\uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this._sendResponse("\uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.", "system");
    }
  }
  /**
   * 응답 메시지 전송
   */
  _sendResponse(text, type = "assistant") {
    if (this._view) {
      this._view.webview.postMessage({
        command: "addMessage",
        type,
        content: text
      });
    }
  }
  /**
   * 모델 목록 전송
   */
  _sendModelList() {
    if (!this._view) {
      this.logger.error("[UI<-EXT] _sendModelList: \uBDF0\uAC00 \uC5C6\uC5B4 \uBAA8\uB378 \uBAA9\uB85D\uC744 \uC804\uC1A1\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    try {
      this.logger.info("[UI<-EXT] \uBAA8\uB378 \uBAA9\uB85D \uC804\uC1A1 \uC2DC\uC791");
      const coreService2 = this._coreService;
      const llmService = coreService2.llmService;
      if (!llmService) {
        this.logger.error("[UI<-EXT] LLM \uC11C\uBE44\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
        throw new Error("LLM \uC11C\uBE44\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      this.logger.info("[UI<-EXT] \uAE30\uBCF8 \uBAA8\uB378 ID:", llmService.getDefaultModelId());
      let modelsArray = llmService.getAvailableModels();
      this.logger.info(`[UI<-EXT] \uAC00\uC838\uC628 \uBAA8\uB378 \uC218: ${modelsArray.length}`);
      if (!Array.isArray(modelsArray)) {
        this.logger.warn("[UI<-EXT] \uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uBAA8\uB378 \uBC30\uC5F4 \uBC18\uD658\uB428. \uBE48 \uBC30\uC5F4\uB85C \uCD08\uAE30\uD654.");
        modelsArray = [];
      }
      if (modelsArray.length < 2) {
        this.logger.info("[UI<-EXT] \uBAA8\uB378 \uBAA9\uB85D\uC774 \uBD88\uCDA9\uBD84\uD558\uC5EC \uAE30\uBCF8 \uBAA8\uB378 \uCD94\uAC00");
        modelsArray.push({
          id: "gemini-2.5-flash",
          name: "Google Gemini 2.5 Flash",
          provider: "openrouter",
          temperature: 0.7,
          apiUrl: "https://openrouter.ai/api/v1/chat/completions",
          apiModel: "google/gemini-2.5-flash-preview"
        });
        if (!modelsArray.some((m) => m.provider === "local")) {
          modelsArray.push({
            id: "local-fallback",
            name: "\uB85C\uCEEC \uC2DC\uBBAC\uB808\uC774\uC158 \uBAA8\uB378",
            provider: "local",
            temperature: 0.7
          });
          this.logger.info("[UI<-EXT] \uB85C\uCEEC \uBAA8\uB378 \uCD94\uAC00\uB428");
        }
        this.logger.info(`[UI<-EXT] \uAE30\uBCF8 \uBAA8\uB378 \uCD94\uAC00 \uD6C4 \uBAA8\uB378 \uC218: ${modelsArray.length}`);
      }
      const models = modelsArray.map((model, index) => {
        try {
          let modelId = model.id || model.modelId || `model-${index}`;
          if (modelId.includes("/") || modelId.includes(":")) {
            modelId = modelId.replace(/[\/:.]/g, "-");
          }
          const modelName = model.name || `\uBAA8\uB378 ${index + 1}`;
          return {
            id: modelId,
            name: modelName,
            provider: model.provider || "unknown"
          };
        } catch (err) {
          this.logger.error(`[UI<-EXT] \uBAA8\uB378 \uBCC0\uD658 \uC911 \uC624\uB958 (\uC778\uB371\uC2A4 ${index}):`, err);
          return {
            id: `model-${index}`,
            name: `\uBAA8\uB378 ${index + 1}`,
            provider: "unknown"
          };
        }
      });
      const uniqueModels = this._removeDuplicateModels(models);
      this.logger.info(`[UI<-EXT] \uC804\uC1A1\uD560 \uBAA8\uB378 \uBAA9\uB85D: ${uniqueModels.length}\uAC1C (\uC911\uBCF5 \uC81C\uAC70 \uD6C4)`);
      uniqueModels.forEach((model, index) => {
        this.logger.info(`[UI<-EXT] \uBAA8\uB378 ${index + 1}: ID=${model.id}, \uC774\uB984=${model.name}, \uC81C\uACF5\uC790=${model.provider}`);
      });
      this._view.webview.postMessage({
        command: "updateModels",
        models: uniqueModels
      });
      this.logger.info("[UI<-EXT] \uBAA8\uB378 \uBAA9\uB85D \uC804\uC1A1 \uC644\uB8CC");
      setTimeout(() => {
        if (this._view && this._view.visible) {
          let defaultModelId = llmService.getDefaultModelId();
          if (!defaultModelId && uniqueModels.length > 0) {
            defaultModelId = uniqueModels[0].id;
            this.logger.info(`[UI<-EXT] \uAE30\uBCF8 \uBAA8\uB378 ID \uBBF8\uC124\uC815, \uCCAB \uBC88\uC9F8 \uBAA8\uB378\uB85C \uC124\uC815: ${defaultModelId}`);
          }
          if (defaultModelId) {
            this._view.webview.postMessage({
              command: "setCurrentModel",
              modelId: defaultModelId
            });
            this.logger.info(`[UI<-EXT] \uD604\uC7AC \uBAA8\uB378 ID \uC804\uC1A1: ${defaultModelId}`);
          }
        }
      }, 500);
    } catch (error) {
      this.logger.error("[UI<-EXT] \uBAA8\uB378 \uBAA9\uB85D \uC804\uC1A1 \uC624\uB958:", error);
      const fallbackModels = [
        { id: "narrans-emergency", name: "NARRANS (\uB0B4\uBD80\uB9DD)", provider: "custom" },
        { id: "openrouter-emergency", name: "Claude 3 Haiku", provider: "openrouter" },
        { id: "local-emergency", name: "\uC624\uD504\uB77C\uC778 \uC751\uAE09 \uBAA8\uB4DC", provider: "local" }
      ];
      this.logger.info("[UI<-EXT] \uBC31\uC5C5 \uBAA8\uB378 \uBAA9\uB85D \uC804\uC1A1:");
      try {
        this._view.webview.postMessage({
          command: "updateModels",
          models: fallbackModels
        });
        this._view.webview.postMessage({
          command: "setCurrentModel",
          modelId: "narrans-emergency"
        });
        this.logger.info("[UI<-EXT] \uBC31\uC5C5 \uBAA8\uB378 \uBAA9\uB85D \uBC0F \uAE30\uBCF8 \uBAA8\uB378 \uC804\uC1A1 \uC131\uACF5");
      } catch (postError) {
        this.logger.error("[UI<-EXT] \uBC31\uC5C5 \uBAA8\uB378 \uBAA9\uB85D \uC804\uC1A1 \uC2E4\uD328:", postError);
      }
    }
  }
  /**
   * 모델 목록에서 중복 제거 및 정렬
   * @param models 모델 목록
   * @returns 중복이 제거된 모델 목록
   */
  _removeDuplicateModels(models) {
    const uniqueIds = /* @__PURE__ */ new Set();
    const uniqueModels = [];
    const providerPriority = {
      "custom": 0,
      "openrouter": 1,
      "local": 2,
      "unknown": 3
    };
    for (const model of models) {
      if (!uniqueIds.has(model.id)) {
        uniqueIds.add(model.id);
        uniqueModels.push(model);
      }
    }
    uniqueModels.sort((a, b) => {
      const priorityA = providerPriority[a.provider] ?? 999;
      const priorityB = providerPriority[b.provider] ?? 999;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.name.localeCompare(b.name);
    });
    return uniqueModels;
  }
  /**
   * VS Code 테마 변경 리스너 등록
   */
  _registerThemeChangeListener() {
    this._sendCurrentTheme();
    vscode5.window.onDidChangeActiveColorTheme((colorTheme) => {
      if (this._view && this._view.visible) {
        this.logger.info(`VS Code \uD14C\uB9C8 \uBCC0\uACBD\uB428: ${colorTheme.kind}`);
        this._sendCurrentTheme();
      }
    });
  }
  /**
   * 현재 테마 정보 전송
   */
  _sendCurrentTheme() {
    if (!this._view || !this._view.visible)
      return;
    try {
      const currentTheme = vscode5.window.activeColorTheme;
      let themeName;
      switch (currentTheme.kind) {
        case vscode5.ColorThemeKind.Light:
          themeName = "vscode-light";
          break;
        case vscode5.ColorThemeKind.Dark:
          themeName = "vscode-dark";
          break;
        case vscode5.ColorThemeKind.HighContrast:
          themeName = "vscode-high-contrast";
          break;
        case vscode5.ColorThemeKind.HighContrastLight:
          themeName = "vscode-high-contrast-light";
          break;
        default:
          themeName = "vscode-dark";
      }
      this.logger.info(`\uD14C\uB9C8 \uC815\uBCF4 \uC804\uC1A1: ${themeName}`);
      this._view.webview.postMessage({
        type: "theme-update",
        theme: themeName
      });
    } catch (error) {
      this.logger.error("\uD14C\uB9C8 \uC815\uBCF4 \uC804\uC1A1 \uC911 \uC624\uB958:", error);
    }
  }
  /**
   * 현재 모델 전송
   */
  _sendCurrentModel() {
    if (!this._view) {
      this.logger.error("_sendCurrentModel: \uBDF0\uAC00 \uC5C6\uC5B4 \uD604\uC7AC \uBAA8\uB378\uC744 \uC804\uC1A1\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    try {
      this.logger.info("\uD604\uC7AC \uBAA8\uB378 \uC804\uC1A1 \uC2DC\uC791");
      const coreService2 = this._coreService;
      if (!coreService2) {
        this.logger.error("_sendCurrentModel: coreService\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
        throw new Error("Core \uC11C\uBE44\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      const llmService = coreService2.llmService;
      if (!llmService) {
        this.logger.error("_sendCurrentModel: llmService\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
        throw new Error("LLM \uC11C\uBE44\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      const availableModels = llmService.getAvailableModels();
      const modelIds = availableModels.map((m) => m.id || m.modelId).filter(Boolean);
      this.logger.info(`\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uBAA8\uB378 ID: ${JSON.stringify(modelIds)}`);
      this.logger.info("getDefaultModelId \uBA54\uC11C\uB4DC \uD638\uCD9C \uC2DC\uB3C4...");
      let defaultModelId = llmService.getDefaultModelId();
      if (!defaultModelId || !modelIds.includes(defaultModelId)) {
        this.logger.warn(`\uAE30\uBCF8 \uBAA8\uB378 ID(${defaultModelId || "undefined"})\uAC00 \uC5C6\uAC70\uB098 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD3F4\uBC31 \uBAA8\uB378 \uC120\uD0DD...`);
        const internalModel = availableModels.find((m) => m.provider === "custom");
        const openRouterModel = availableModels.find((m) => m.provider === "openrouter");
        const localModel = availableModels.find((m) => m.provider === "local");
        const firstAvailableModel = availableModels[0];
        defaultModelId = internalModel && (internalModel.id || internalModel.modelId) || openRouterModel && (openRouterModel.id || openRouterModel.modelId) || localModel && (localModel.id || localModel.modelId) || firstAvailableModel && (firstAvailableModel.id || firstAvailableModel.modelId) || "openrouter-claude-3-haiku";
        this.logger.info(`\uD3F4\uBC31 \uBAA8\uB378 ID\uB85C \uC124\uC815\uB428: ${defaultModelId}`);
      } else {
        this.logger.info(`\uD604\uC7AC \uAE30\uBCF8 \uBAA8\uB378: ${defaultModelId}`);
      }
      if (defaultModelId && (defaultModelId.includes("/") || defaultModelId.includes(":"))) {
        const cleanModelId = defaultModelId.replace(/[\/:.]/g, "-");
        this.logger.info(`\uBAA8\uB378 ID\uC5D0 \uD2B9\uC218 \uBB38\uC790 \uD3EC\uD568, \uC815\uB9AC\uB428: ${defaultModelId} -> ${cleanModelId}`);
        defaultModelId = cleanModelId;
      }
      if (defaultModelId) {
        const selectedModel = availableModels.find(
          (m) => m.id === defaultModelId || m.modelId === defaultModelId
        );
        if (selectedModel) {
          this.logger.info(`\uC120\uD0DD\uB41C \uBAA8\uB378 \uC815\uBCF4: ${JSON.stringify({
            id: selectedModel.id || selectedModel.modelId,
            name: selectedModel.name,
            provider: selectedModel.provider
          })}`);
        }
      }
      if (this._view && this._view.visible && defaultModelId) {
        try {
          this._view.webview.postMessage({
            command: "setCurrentModel",
            modelId: defaultModelId
          });
          this.logger.info(`\uD604\uC7AC \uBAA8\uB378 ID(${defaultModelId}) \uC804\uC1A1 \uC131\uACF5`);
          vscode5.workspace.getConfiguration("ape.llm").update(
            "defaultModel",
            defaultModelId,
            vscode5.ConfigurationTarget.Global
          ).then(() => {
            this.logger.info(`\uBAA8\uB378 ID\uAC00 \uC124\uC815\uC5D0 \uC800\uC7A5\uB428: ${defaultModelId}`);
          }).catch((err) => {
            this.logger.error("\uC124\uC815 \uC800\uC7A5 \uC911 \uC624\uB958:", err);
          });
        } catch (postError) {
          this.logger.error("\uD604\uC7AC \uBAA8\uB378 ID \uC804\uC1A1 \uC911 \uC624\uB958:", postError);
        }
      }
    } catch (error) {
      this.logger.error("\uD604\uC7AC \uBAA8\uB378 \uC804\uC1A1 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.logger.error("\uC624\uB958 \uC0C1\uC138:", error instanceof Error ? error.stack : "Error stack not available");
      try {
        const fallbackModelIds = [
          "narrans-emergency",
          "openrouter-claude-3-haiku",
          "local-emergency"
        ];
        let selectedFallback = fallbackModelIds[0];
        const currentHour = (/* @__PURE__ */ new Date()).getHours();
        if (currentHour % 3 === 0) {
          selectedFallback = fallbackModelIds[0];
        } else if (currentHour % 3 === 1) {
          selectedFallback = fallbackModelIds[1];
        } else {
          selectedFallback = fallbackModelIds[2];
        }
        this.logger.info(`\uC624\uB958 \uBC1C\uC0DD\uC73C\uB85C \uC778\uD55C \uD3F4\uBC31 \uBAA8\uB378 ID \uC120\uD0DD: ${selectedFallback}`);
        if (this._view && this._view.visible) {
          this._view.webview.postMessage({
            command: "setCurrentModel",
            modelId: selectedFallback
          });
          this.logger.info("\uC624\uB958 \uBCF5\uAD6C \uBAA8\uB378 ID \uC804\uC1A1 \uC131\uACF5");
        }
      } catch (postError) {
        this.logger.error("\uC624\uB958 \uBCF5\uAD6C \uBAA8\uB378 ID \uC804\uC1A1 \uC911 \uCD94\uAC00 \uC624\uB958:", postError);
      }
    }
  }
  /**
   * 명령어 목록 전송
   */
  async _sendCommandsList() {
    if (!this._view) {
      return;
    }
    try {
      const coreService2 = this._coreService;
      const commandRegistry = coreService2.commandRegistry;
      const allUsages = commandRegistry.getAllCommandUsages();
      const commands4 = allUsages.map((usage) => {
        const isAtCommand = usage.syntax.startsWith("@");
        const isSlashCommand = usage.syntax.startsWith("/");
        let domain = "";
        if (isAtCommand && usage.domain) {
          domain = usage.domain;
        } else if (isSlashCommand) {
          domain = "system";
        }
        const isFavorite = ["help", "model", "debug", "clear"].includes(usage.command);
        return {
          id: usage.syntax,
          label: usage.command,
          description: usage.description,
          syntax: usage.syntax,
          examples: usage.examples || [],
          type: isAtCommand ? "at" : isSlashCommand ? "slash" : "other",
          domain,
          frequent: isFavorite,
          iconName: this._getIconForCommand(usage.command, domain)
        };
      });
      const dynamicData = await this._getDynamicData();
      this._view.webview.postMessage({
        command: "updateCommands",
        commands: commands4,
        dynamicData
      });
      this.logger.info(`${commands4.length}\uAC1C\uC758 \uBA85\uB839\uC5B4\uC640 \uB3D9\uC801 \uB370\uC774\uD130\uB97C \uC6F9\uBDF0\uB85C \uC804\uC1A1\uD588\uC2B5\uB2C8\uB2E4.`);
    } catch (error) {
      this.logger.error("\uBA85\uB839\uC5B4 \uBAA9\uB85D \uC804\uC1A1 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * 동적 데이터 가져오기 (Git 브랜치 및 컨텍스트 기반 명령어)
   * @returns 동적 데이터 객체
   */
  async _getDynamicData() {
    try {
      const coreService2 = this._coreService;
      const pluginRegistry = coreService2.pluginRegistry;
      const commandService = coreService2.commandService;
      const dynamicData = {};
      const gitPlugin = pluginRegistry ? pluginRegistry.getPlugin("git") : null;
      if (gitPlugin) {
        try {
          const gitClient = gitPlugin.client;
          if (gitClient && typeof gitClient.getBranches === "function") {
            const branches = await gitClient.getBranches(true);
            if (branches && Array.isArray(branches)) {
              dynamicData["gitBranches"] = branches;
              this.logger.info(`Git \uBE0C\uB79C\uCE58 \uC815\uBCF4 \uB85C\uB4DC \uC644\uB8CC: ${branches.length}\uAC1C \uBE0C\uB79C\uCE58`);
            }
          }
        } catch (gitError) {
          this.logger.error("Git \uBE0C\uB79C\uCE58 \uC815\uBCF4 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328:", gitError);
        }
      }
      if (commandService) {
        try {
          const contextCache = commandService.getContextCache();
          const baseCommands = [
            { id: "@git:commit", label: "Git \uCEE4\uBC0B" },
            { id: "@git:push", label: "Git \uD478\uC2DC" },
            { id: "@git:checkout", label: "Git \uCCB4\uD06C\uC544\uC6C3" },
            { id: "@git:branch", label: "Git \uBE0C\uB79C\uCE58 \uC0DD\uC131" },
            { id: "@jira:issue", label: "Jira \uC774\uC288 \uC870\uD68C" },
            { id: "@jira:create", label: "Jira \uC774\uC288 \uC0DD\uC131" },
            { id: "@jira:search", label: "Jira \uC774\uC288 \uAC80\uC0C9" },
            { id: "@swdp:build", label: "SWDP \uBE4C\uB4DC" },
            { id: "@swdp:build-status", label: "SWDP \uBE4C\uB4DC \uC0C1\uD0DC" },
            { id: "@swdp:test", label: "SWDP \uD14C\uC2A4\uD2B8" },
            { id: "@pocket:ls", label: "Pocket \uD30C\uC77C \uBAA9\uB85D" },
            { id: "@pocket:load", label: "Pocket \uD30C\uC77C \uB85C\uB4DC" },
            { id: "@pocket:search", label: "Pocket \uD30C\uC77C \uAC80\uC0C9" }
          ];
          const contextCommands = [];
          for (const baseCmd of baseCommands) {
            try {
              const result = await commandService.generateContextualCommand(baseCmd.id);
              if (Array.isArray(result)) {
                result.forEach((cmdStr, index) => {
                  contextCommands.push({
                    id: cmdStr,
                    label: `${baseCmd.label} (\uCEE8\uD14D\uC2A4\uD2B8 \uC635\uC158 ${index + 1})`,
                    description: "\uCEE8\uD14D\uC2A4\uD2B8 \uAE30\uBC18 \uCD94\uCC9C \uBA85\uB839\uC5B4",
                    type: "at",
                    group: cmdStr.split(":")[0].replace("@", ""),
                    contextual: true
                  });
                });
              } else if (typeof result === "string" && result !== baseCmd.id) {
                contextCommands.push({
                  id: result,
                  label: `${baseCmd.label} (\uCEE8\uD14D\uC2A4\uD2B8 \uCD94\uCC9C)`,
                  description: "\uCEE8\uD14D\uC2A4\uD2B8 \uAE30\uBC18 \uCD94\uCC9C \uBA85\uB839\uC5B4",
                  type: "at",
                  group: result.split(":")[0].replace("@", ""),
                  contextual: true
                });
              }
            } catch (cmdError) {
              this.logger.error(`\uCEE8\uD14D\uC2A4\uD2B8 \uBA85\uB839\uC5B4 \uC0DD\uC131 \uC624\uB958 (${baseCmd.id}):`, cmdError);
            }
          }
          if (contextCommands.length > 0) {
            dynamicData["contextCommands"] = contextCommands;
            this.logger.info(`\uCEE8\uD14D\uC2A4\uD2B8 \uAE30\uBC18 \uBA85\uB839\uC5B4 ${contextCommands.length}\uAC1C \uC0DD\uC131 \uC644\uB8CC`);
          }
        } catch (contextError) {
          this.logger.error("\uCEE8\uD14D\uC2A4\uD2B8 \uAE30\uBC18 \uBA85\uB839\uC5B4 \uC0DD\uC131 \uC911 \uC624\uB958:", contextError);
        }
      }
      return dynamicData;
    } catch (error) {
      this.logger.error("\uB3D9\uC801 \uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return {};
    }
  }
  /**
   * TreeView 액션 처리
   * @param message 트리뷰 액션 메시지
   */
  _handleTreeViewAction(message) {
    this.logger.info("TreeView \uC561\uC158 \uCC98\uB9AC:", message);
    const actionType = message.actionType;
    const item = message.item;
    if (!actionType || !item) {
      return;
    }
    switch (actionType) {
      case "select":
        this._handleTreeItemSelection(item);
        break;
      case "execute":
        if (item.type === "command" && item.id) {
          this._executeCommand(item.id);
        }
        break;
      case "showDetails":
        if (item.type === "command" && item.id) {
          this._showCommandDetails({ id: item.id, type: item.type });
        }
        break;
    }
  }
  /**
   * TreeView 아이템 선택 처리
   * @param item 선택된 트리 아이템
   */
  _handleTreeItemSelection(item) {
    this.logger.info("TreeView \uC544\uC774\uD15C \uC120\uD0DD:", item);
    switch (item.type) {
      case "command":
        if (this._view && item.id) {
          this._view.webview.postMessage({
            command: "highlightCommand",
            commandId: item.id
          });
        }
        break;
      case "chat-session":
        if (this._view && item.id) {
          this.logger.info("\uCC44\uD305 \uC138\uC158 \uB85C\uB4DC:", item.id);
        }
        break;
    }
  }
  /**
   * 명령어 세부 정보 표시
   * @param item 명령어 아이템
   */
  _showCommandDetails(item) {
    if (!this._view) {
      return;
    }
    this.logger.info("\uBA85\uB839\uC5B4 \uC138\uBD80 \uC815\uBCF4 \uD45C\uC2DC:", item);
    this._view.webview.postMessage({
      command: "showCommandDetail",
      commandItem: item
    });
  }
  /**
   * 명령어에 적합한 아이콘 결정
   * @param command 명령어 이름
   * @param domain 명령어 도메인
   * @returns 아이콘 객체 {icon: string, source: string}
   */
  /**
   * 뷰 크기 정보 전송 - 웹뷰 레이아웃 조정에 사용됨
   */
  _sendViewDimensions() {
    if (!this._view || !this._view.visible) {
      return;
    }
    try {
      this._view.webview.postMessage({
        command: "viewDimensions",
        // 실제 치수는 웹뷰에서 window.innerWidth/Height로 접근함
        visible: true,
        timestamp: Date.now()
      });
      this.logger.debug("\uBDF0 \uD06C\uAE30 \uC815\uBCF4 \uC804\uC1A1\uB428");
    } catch (error) {
      this.logger.error("\uBDF0 \uD06C\uAE30 \uC815\uBCF4 \uC804\uC1A1 \uC2E4\uD328:", error);
    }
  }
  _getIconForCommand(command, domain) {
    const domainIcons = {
      "system": { icon: "gear-six", source: "phosphor" },
      "git": { icon: "git-branch", source: "phosphor" },
      "doc": { icon: "file-text", source: "phosphor" },
      "jira": { icon: "kanban", source: "phosphor" },
      "pocket": { icon: "archive-box", source: "phosphor" },
      "vault": { icon: "database", source: "phosphor" },
      "rules": { icon: "scales", source: "phosphor" },
      "swdp": { icon: "infinity", source: "phosphor" }
    };
    const commandIcons = {
      "commit": { icon: "git-commit", source: "phosphor" },
      "push": { icon: "arrow-up", source: "phosphor" },
      "pull": { icon: "git-pull-request", source: "phosphor" },
      "branch": { icon: "git-branch", source: "phosphor" },
      "merge": { icon: "git-merge", source: "phosphor" },
      "clone": { icon: "copy", source: "phosphor" },
      "issue": { icon: "note-pencil", source: "phosphor" },
      "ticket": { icon: "note-pencil", source: "phosphor" },
      "bug": { icon: "bug", source: "phosphor" },
      "task": { icon: "clipboard-text", source: "phosphor" },
      "help": { icon: "question", source: "phosphor" },
      "model": { icon: "robot", source: "phosphor" },
      "debug": { icon: "bug", source: "phosphor" },
      "clear": { icon: "trash", source: "phosphor" },
      "settings": { icon: "gear-six", source: "phosphor" },
      "config": { icon: "sliders", source: "phosphor" },
      "search": { icon: "magnifying-glass", source: "phosphor" },
      "list": { icon: "list", source: "phosphor" },
      "build": { icon: "hammer", source: "phosphor" },
      "deploy": { icon: "cloud-arrow-up", source: "phosphor" },
      "test": { icon: "test-tube", source: "phosphor" },
      "document": { icon: "file-text", source: "phosphor" },
      "save": { icon: "floppy-disk", source: "phosphor" }
    };
    if (commandIcons[command]) {
      return commandIcons[command];
    }
    for (const [keyword, icon] of Object.entries(commandIcons)) {
      if (command.includes(keyword)) {
        return icon;
      }
    }
    return domainIcons[domain] || { icon: "terminal", source: "phosphor" };
  }
  /**
   * 명령어 실행
   */
  async _executeCommand(commandId) {
    if (!this._view) {
      return;
    }
    try {
      this.logger.info(`\uBA85\uB839\uC5B4 \uC2E4\uD589: ${commandId}`);
      this._sendResponse(`\uBA85\uB839\uC5B4 '${commandId}' \uC2E4\uD589 \uC911...`, "system");
      const isInternalCommand = commandId.startsWith("/");
      const isExternalCommand = commandId.startsWith("@");
      if (isInternalCommand || isExternalCommand) {
        const result = await this._chatService.processMessage(commandId);
        if (result) {
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: "removeSystemMessage",
              content: `\uBA85\uB839\uC5B4 '${commandId}' \uC2E4\uD589 \uC911...`
            });
          }
          let isError = false;
          const isCommandResult = (obj) => {
            return obj !== null && typeof obj === "object" && "success" in obj;
          };
          if (typeof result === "object" && result !== null) {
            if (result && isCommandResult(result)) {
              const typedResult = result;
              if (typedResult.message) {
                const responseType = typedResult.error ? "system" : "assistant";
                isError = !!typedResult.error;
                this._sendResponse(typedResult.message, responseType);
              } else {
                this._sendResponse(JSON.stringify(typedResult, null, 2), "assistant");
              }
            } else if (result && "content" in result) {
              const content = result.content;
              const hasError = "error" in result && !!result.error;
              const responseType = hasError ? "system" : "assistant";
              isError = hasError;
              this._sendResponse(content, responseType);
            } else {
              this._sendResponse(JSON.stringify(result, null, 2), "assistant");
            }
          } else {
            this._sendResponse(String(result), "assistant");
          }
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: "commandExecuted",
              commandId,
              success: !isError
            });
          }
        }
      } else {
        vscode5.commands.executeCommand(commandId).then((result) => {
          this.logger.info("VS Code \uBA85\uB839\uC5B4 \uC2E4\uD589 \uACB0\uACFC:", result);
          this._sendResponse(`\uBA85\uB839\uC5B4 '${commandId}' \uC2E4\uD589 \uC644\uB8CC`, "system");
        }, (error) => {
          this.logger.error("VS Code \uBA85\uB839\uC5B4 \uC2E4\uD589 \uC624\uB958:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          this._sendResponse(`\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC624\uB958: ${errorMessage}`, "system");
        });
      }
    } catch (error) {
      this.logger.error("\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this._sendResponse(`\uBA85\uB839\uC5B4 \uC2E4\uD589 \uC911 \uC624\uB958 \uBC1C\uC0DD: ${error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`, "system");
    }
  }
  /**
   * 모델 변경
   */
  /**
   * 현재 대화 저장
   */
  saveCurrentSession() {
    try {
      this.logger.info("\uD604\uC7AC \uB300\uD654 \uC800\uC7A5 \uC2DC\uB3C4");
      vscode5.window.showInputBox({
        prompt: "\uC800\uC7A5\uD560 \uB300\uD654 \uC138\uC158\uC758 \uC81C\uBAA9\uC744 \uC785\uB825\uD558\uC138\uC694",
        placeHolder: "\uC81C\uBAA9 \uC5C6\uC74C"
      }).then((title) => {
        if (title !== void 0) {
          try {
            this._chatService.saveCurrentSession(title);
            vscode5.window.showInformationMessage("\uB300\uD654\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
            vscode5.commands.executeCommand("ape.refreshTreeView");
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error("\uB300\uD654 \uC800\uC7A5 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
            if (this._view) {
              this._view.webview.postMessage({
                command: "addMessage",
                type: "system",
                content: `\uB300\uD654\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ${errorMessage}`
              });
            }
            vscode5.window.showErrorMessage(`\uB300\uD654\uB97C \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: ${errorMessage}`);
          }
        }
      });
    } catch (error) {
      this.logger.error("\uB300\uD654 \uC800\uC7A5 \uC785\uB825 \uC0C1\uC790 \uD45C\uC2DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  _changeModel(modelId) {
    if (!modelId) {
      this.logger.warn("_changeModel: \uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uBAA8\uB378 ID\uB85C \uD638\uCD9C\uB428");
      return;
    }
    try {
      this.logger.info(`\uBAA8\uB378 \uBCC0\uACBD \uC694\uCCAD - DEBUG \uBC84\uC804: ${modelId}`);
      const coreService2 = this._coreService;
      const llmService = coreService2.llmService;
      if (!llmService) {
        this.logger.error("_changeModel: llmService\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
        throw new Error("LLM \uC11C\uBE44\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      const currentDefaultId = llmService.getDefaultModelId();
      this.logger.info(`\uD604\uC7AC \uAE30\uBCF8 \uBAA8\uB378: ${currentDefaultId || "none"}, \uBCC0\uACBD \uC694\uCCAD \uBAA8\uB378: ${modelId}`);
      if (currentDefaultId && currentDefaultId === modelId) {
        this.logger.info(`\uD604\uC7AC \uBAA8\uB378\uACFC \uB3D9\uC77C\uD55C \uBAA8\uB378(${modelId})\uB85C \uBCC0\uACBD \uC694\uCCAD, \uBB34\uC2DC\uD568`);
        if (this._view && this._view.visible) {
          this._view.webview.postMessage({
            command: "modelChanged",
            modelId,
            success: true,
            changed: false
          });
        }
        return;
      }
      this.logger.info("\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uBAA8\uB378 \uBAA9\uB85D \uC870\uD68C \uC911...");
      const models = llmService.getAvailableModels();
      this.logger.info(`\uCD1D ${models.length}\uAC1C\uC758 \uBAA8\uB378 \uC870\uD68C\uB428`);
      models.forEach((model, idx) => {
        this.logger.info(`\uBAA8\uB378 ${idx + 1}:`, {
          id: model.id || "[\uC5C6\uC74C]",
          modelId: model.modelId || "[\uC5C6\uC74C]",
          name: model.name,
          provider: model.provider || "[\uC5C6\uC74C]",
          apiModel: model.apiModel || "[\uC5C6\uC74C]"
        });
      });
      const validModel = models.find((model) => {
        const possibleIds = [
          model.id,
          model.modelId,
          model.apiModel ? model.apiModel.replace(/[\/:.]/g, "-") : null,
          model.name ? `${model.provider || "model"}-${model.name.toLowerCase().replace(/\s+/g, "-")}` : null
        ].filter(Boolean);
        this.logger.info(`\uBAA8\uB378 ${model.name} \uAC00\uB2A5\uD55C ID \uBAA9\uB85D:`, possibleIds);
        return possibleIds.includes(modelId);
      });
      if (!validModel) {
        this.logger.warn(`\uC694\uCCAD\uB41C \uBAA8\uB378 ID '${modelId}'\uAC00 \uC720\uD6A8\uD55C \uBAA8\uB378 \uBAA9\uB85D\uC5D0 \uC5C6\uC2B5\uB2C8\uB2E4.`);
        this.logger.info("===== \uC720\uD6A8\uD55C \uBAA8\uB378 \uBAA9\uB85D (ID \uAE30\uC900) =====");
        models.forEach((model, idx) => {
          this.logger.info(`${idx + 1}. ${model.id || model.modelId || "[ID \uC5C6\uC74C]"}: ${model.name}`);
        });
        this.logger.info("\uBAA8\uB378 \uC720\uD6A8\uC131 \uAC80\uC0AC \uC2E4\uD328\uD588\uC73C\uB098 \uACC4\uC18D \uC9C4\uD589\uD569\uB2C8\uB2E4. \uC678\uBD80\uC5D0\uC11C \uCD94\uAC00\uB41C \uBAA8\uB378\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
      } else {
        this.logger.info(`\uC720\uD6A8\uD55C \uBAA8\uB378\uC744 \uCC3E\uC558\uC2B5\uB2C8\uB2E4: ${validModel.name} (ID: ${validModel.id || validModel.modelId})`);
      }
      this.logger.info(`VS Code \uC124\uC815\uC5D0 \uBAA8\uB378 ID(${modelId}) \uC800\uC7A5 \uC2DC\uB3C4...`);
      const config = vscode5.workspace.getConfiguration("ape.llm");
      config.update("defaultModel", modelId, vscode5.ConfigurationTarget.Global).then(() => {
        this.logger.info(`\uBAA8\uB378\uC774 ${modelId}\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`);
        if (this._view && this._view.visible) {
          this.logger.info("\uC6F9\uBDF0\uC5D0 \uBAA8\uB378 \uBCC0\uACBD \uC131\uACF5 \uC54C\uB9BC \uC804\uC1A1");
          this._view.webview.postMessage({
            command: "modelChanged",
            modelId,
            success: true,
            changed: true
          });
          const modelName = validModel ? validModel.name : modelId;
          this.logger.info(`\uC2DC\uC2A4\uD15C \uBA54\uC2DC\uC9C0\uB85C \uBAA8\uB378 \uBCC0\uACBD \uC54C\uB9BC: ${modelName}`);
          this._sendResponse(`\uBAA8\uB378\uC774 '${modelName}'(\uC73C)\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "system");
        }
      }, (err) => {
        this.logger.error("\uC124\uC815 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958 \uBC1C\uC0DD:", err);
        this.logger.error("\uC624\uB958 \uC0C1\uC138:", err.stack);
        if (this._view && this._view.visible) {
          this.logger.info("\uC6F9\uBDF0\uC5D0 \uBAA8\uB378 \uBCC0\uACBD \uC2E4\uD328 \uC54C\uB9BC \uC804\uC1A1");
          this._view.webview.postMessage({
            command: "modelChanged",
            modelId,
            success: false,
            error: err.message || "\uC124\uC815 \uC5C5\uB370\uC774\uD2B8 \uC2E4\uD328"
          });
        }
      });
    } catch (error) {
      this.logger.error("\uBAA8\uB378 \uBCC0\uACBD \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this.logger.error("\uC624\uB958 \uC0C1\uC138:", error instanceof Error ? error.stack : "\uC2A4\uD0DD \uC815\uBCF4 \uC5C6\uC74C");
      if (this._view && this._view.visible) {
        try {
          this.logger.info("\uC6F9\uBDF0\uC5D0 \uBAA8\uB378 \uBCC0\uACBD \uC624\uB958 \uC54C\uB9BC \uC804\uC1A1");
          this._view.webview.postMessage({
            command: "modelChanged",
            modelId,
            success: false,
            error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"
          });
        } catch (postError) {
          this.logger.error("\uC624\uB958 \uC54C\uB9BC \uC804\uC1A1 \uC911 \uCD94\uAC00 \uC624\uB958:", postError);
        }
      }
    }
  }
  /**
   * 채팅 초기화
   */
  clearChat() {
    if (this._view) {
      this._view.webview.postMessage({
        command: "clearChat"
      });
      setTimeout(() => {
        this._view?.webview.postMessage({
          command: "addMessage",
          type: "system",
          content: "\uCC44\uD305\uC774 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
        });
        setTimeout(() => {
          this._sendResponse(this._chatService.getWelcomeMessage(), "assistant");
        }, 500);
      }, 100);
    }
  }
  /**
   * HTML 내용 생성
   */
  _getHtmlContent(webview) {
    const htmlPath = vscode5.Uri.joinPath(this._extensionUri, "resources", "html", "chat.html");
    const webviewResourceBaseUri = webview.asWebviewUri(vscode5.Uri.joinPath(this._extensionUri, "resources"));
    try {
      if (!fs3.existsSync(htmlPath.fsPath)) {
        this.logger.error(`HTML \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: ${htmlPath.fsPath}`);
        throw new Error("HTML \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      const resourceMap = this._createResourceMap(webview);
      let htmlContent = fs3.readFileSync(htmlPath.fsPath, "utf8");
      const cspSource = webview.cspSource;
      htmlContent = htmlContent.replace(/\$\{cspSource\}/g, cspSource);
      htmlContent = htmlContent.replace(/\$\{webviewResourceBaseUri\}/g, webviewResourceBaseUri.toString());
      for (const [key, uri] of Object.entries(resourceMap)) {
        const placeholder = `\${${key}}`;
        const regex = new RegExp(placeholder, "g");
        htmlContent = htmlContent.replace(regex, uri.toString());
      }
      this.logger.info("HTML \uD30C\uC77C \uB85C\uB4DC \uC131\uACF5:", htmlPath.fsPath);
      this.logger.info("\uAE30\uBCF8 \uB9AC\uC18C\uC2A4 \uACBD\uB85C:", webviewResourceBaseUri.toString());
      return htmlContent;
    } catch (error) {
      this.logger.error("HTML \uD30C\uC77C\uC744 \uC77D\uB294 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return `<!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
        <title>APE \uCC44\uD305</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
          }
          .error {
            color: var(--vscode-errorForeground);
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>APE \uCC44\uD305</h1>
        <div class="error">
          <p>\uC624\uB958: \uCC44\uD305 \uC778\uD130\uD398\uC774\uC2A4\uB97C \uB85C\uB4DC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.</p>
          <p>HTML \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uAC70\uB098 \uC77D\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.</p>
          <p>\uACBD\uB85C: ${htmlPath.fsPath}</p>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
        </script>
      </body>
      </html>`;
    }
  }
  /**
   * 리소스 URI 매핑 생성
   * @param webview VS Code 웹뷰 인스턴스
   * @returns 리소스 키와 URI 매핑 객체
   */
  _createResourceMap(webview) {
    const cssResources = {
      cssUri: this._getUri(webview, "resources", "css", "main.css"),
      codiconsUri: this._getUri(webview, "resources", "codicons", "codicon.css"),
      phosphorIconsCssUri: this._getUri(webview, "resources", "fonts", "phosphor", "css", "regular.css")
    };
    const jsResources = {
      modelSelectorJsUri: this._getUri(webview, "resources", "js", "components", "model-selector.js"),
      codeBlocksJsUri: this._getUri(webview, "resources", "js", "components", "code-blocks.js"),
      commandButtonsJsUri: this._getUri(webview, "resources", "js", "components", "command-buttons.js"),
      apeUiJsUri: this._getUri(webview, "resources", "js", "core", "ape-ui.js"),
      loggerJsUri: this._getUri(webview, "resources", "js", "utils", "logger.js"),
      domUtilsJsUri: this._getUri(webview, "resources", "js", "utils", "dom-utils.js"),
      eventBusJsUri: this._getUri(webview, "resources", "js", "utils", "event-bus.js")
    };
    const htmlResources = {
      commandsHtmlUri: this._getUri(webview, "resources", "html", "command-buttons.html")
    };
    return {
      ...cssResources,
      ...jsResources,
      ...htmlResources
    };
  }
  /**
   * 안전한 URI 생성 헬퍼 메소드
   * 파일이 존재하지 않아도 URI는 항상 생성
   */
  _getUri(webview, ...pathSegments) {
    return webview.asWebviewUri(vscode5.Uri.joinPath(this._extensionUri, ...pathSegments));
  }
};

// src/services/ChatHistoryService.ts
var ChatHistoryService = class {
  constructor(context) {
    this.context = context;
    // 전역 상태에 저장될 키
    this.CHAT_HISTORY_KEY = "ape.chatHistory";
    // 최대 저장 세션 수
    this.MAX_SESSIONS = 20;
  }
  /**
   * 새 채팅 세션 저장
   * @param title 세션 제목
   * @param messages 채팅 메시지 배열
   * @returns 저장된 세션 ID
   */
  saveSession(title, messages) {
    const sessions = this.getAllSessions();
    const sessionId = `session-${Date.now()}`;
    const newSession = {
      id: sessionId,
      title: title || this.generateSessionTitle(messages),
      timestamp: Date.now(),
      messages: [...messages]
    };
    sessions.unshift(newSession);
    if (sessions.length > this.MAX_SESSIONS) {
      sessions.splice(this.MAX_SESSIONS);
    }
    this.context.globalState.update(this.CHAT_HISTORY_KEY, sessions);
    return sessionId;
  }
  /**
   * 채팅 세션 로드
   * @param sessionId 세션 ID
   * @returns 채팅 세션 또는 undefined
   */
  getSession(sessionId) {
    const sessions = this.getAllSessions();
    return sessions.find((session) => session.id === sessionId);
  }
  /**
   * 모든 채팅 세션 가져오기
   * @returns 채팅 세션 배열
   */
  getAllSessions() {
    const sessions = this.context.globalState.get(this.CHAT_HISTORY_KEY, []);
    return sessions;
  }
  /**
   * 채팅 세션 삭제
   * @param sessionId 세션 ID
   * @returns 삭제 성공 여부
   */
  deleteSession(sessionId) {
    const sessions = this.getAllSessions();
    const initialLength = sessions.length;
    const filteredSessions = sessions.filter((session) => session.id !== sessionId);
    if (filteredSessions.length !== initialLength) {
      this.context.globalState.update(this.CHAT_HISTORY_KEY, filteredSessions);
      return true;
    }
    return false;
  }
  /**
   * 모든 채팅 히스토리 삭제
   */
  clearAllHistory() {
    this.context.globalState.update(this.CHAT_HISTORY_KEY, []);
  }
  /**
   * 채팅 세션 제목 생성
   * @param messages 채팅 메시지 배열
   * @returns 자동 생성된 세션 제목
   */
  generateSessionTitle(messages) {
    const firstUserMessage = messages.find((msg) => msg.type === "user");
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      const title = content.length > 30 ? content.substring(0, 30) + "..." : content;
      return title;
    }
    const now = /* @__PURE__ */ new Date();
    return `\uB300\uD654 \uC138\uC158 ${now.toLocaleDateString("ko-KR")} ${now.toLocaleTimeString("ko-KR")}`;
  }
  /**
   * 날짜별로 채팅 세션 그룹화
   * @returns 날짜별로 그룹화된 세션 맵
   */
  getSessionsByDate() {
    const sessions = this.getAllSessions();
    const sessionsByDate = /* @__PURE__ */ new Map();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    sessions.forEach((session) => {
      const sessionDate = new Date(session.timestamp);
      sessionDate.setHours(0, 0, 0, 0);
      let dateKey;
      if (sessionDate.getTime() === today.getTime()) {
        dateKey = "today";
      } else if (sessionDate.getTime() === yesterday.getTime()) {
        dateKey = "yesterday";
      } else {
        dateKey = sessionDate.toLocaleDateString("ko-KR");
      }
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, []);
      }
      sessionsByDate.get(dateKey)?.push(session);
    });
    return sessionsByDate;
  }
};

// src/services/ChatService.ts
var ChatService = class {
  constructor(apeCore, context) {
    this.apeCore = apeCore;
    this.context = context;
    this.conversation = [];
    this.welcomeMessages = [
      "\uC548\uB155\uD558\uC138\uC694! APE \uCC44\uD305\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4.",
      "\uBB38\uC758\uC0AC\uD56D\uC774\uB098 \uB3C4\uC6C0\uC774 \uD544\uC694\uD55C \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.",
      "@ \uBA85\uB839\uC5B4\uB098 / \uBA85\uB839\uC5B4\uB97C \uC0AC\uC6A9\uD558\uC5EC \uD2B9\uBCC4\uD55C \uAE30\uB2A5\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    ];
    this.currentSessionId = null;
    this.historyService = new ChatHistoryService(context);
    this.apeCore.initialize().then(() => {
      this.addSystemMessage("APE \uCF54\uC5B4 \uC11C\uBE44\uC2A4\uAC00 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    }).catch((error) => {
      this.addSystemMessage("APE \uCF54\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
      console.error("\uCF54\uC5B4 \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC624\uB958:", error);
    });
  }
  /**
   * 사용자 메시지 처리 후 응답 생성
   */
  async processMessage(text, onUpdate, options) {
    this.addMessage("user", text);
    const embedDevMode = options?.embedDevMode || false;
    console.log(`ChatService: \uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC2DC\uC791 - "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`);
    console.log(`ChatService: \uC2A4\uD2B8\uB9AC\uBC0D \uBAA8\uB4DC - ${onUpdate ? "\uCF1C\uC9D0" : "\uAEBC\uC9D0"}`);
    console.log(`ChatService: \uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC - ${embedDevMode ? "\uCF1C\uC9D0" : "\uAEBC\uC9D0"}`);
    if (text.trim().toLowerCase() === "/clear") {
      this.clearConversation();
      const clearMessage = "\uB300\uD654 \uAE30\uB85D\uC774 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
      this.addMessage("system", clearMessage);
      return Promise.resolve(clearMessage);
    }
    try {
      let accumulatedResponse = "";
      let chunkCount = 0;
      const streamingCallback = onUpdate ? (chunk) => {
        accumulatedResponse += chunk;
        onUpdate(chunk);
        chunkCount++;
        if (chunkCount <= 2 || chunkCount % 50 === 0) {
          console.log(`ChatService: \uC2A4\uD2B8\uB9AC\uBC0D \uCCAD\uD06C #${chunkCount} \uC218\uC2E0 \uBC0F \uC804\uB2EC - \uAE38\uC774: ${chunk.length}\uC790`);
        }
      } : void 0;
      console.log("ChatService: ApeCoreService\uC5D0 \uBA54\uC2DC\uC9C0 \uC804\uB2EC");
      let enhancedOptions = {};
      if (embedDevMode) {
        enhancedOptions = {
          embedDevMode: true,
          deepAnalysis: true,
          internalDataAccess: true
        };
        console.log("ChatService: \uC2EC\uCE35 \uBD84\uC11D \uBAA8\uB4DC \uC801\uC6A9 - \uACE0\uAE09 \uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uBC0F \uB0B4\uBD80 \uB370\uC774\uD130 \uC811\uADFC \uD65C\uC131\uD654");
      }
      const response = await this.apeCore.processMessage(text, streamingCallback ? {
        stream: true,
        onUpdate: streamingCallback,
        ...enhancedOptions
      } : enhancedOptions);
      let responseContent;
      if (streamingCallback && accumulatedResponse) {
        console.log(`ChatService: \uC2A4\uD2B8\uB9AC\uBC0D \uC751\uB2F5 \uC644\uB8CC - \uCD1D \uCCAD\uD06C: ${chunkCount}, \uC804\uCCB4 \uAE38\uC774: ${accumulatedResponse.length}\uC790`);
        responseContent = accumulatedResponse;
      } else {
        console.log("ChatService: \uC77C\uBC18 \uC751\uB2F5 \uCC98\uB9AC");
        if (typeof response === "object") {
          if (response.content) {
            responseContent = response.content;
          } else {
            responseContent = JSON.stringify(response, null, 2);
          }
        } else {
          responseContent = response.toString();
        }
        console.log(`ChatService: \uC751\uB2F5 \uAE38\uC774: ${responseContent.length}\uC790`);
      }
      this.addMessage("assistant", responseContent);
      return responseContent;
    } catch (error) {
      console.error("\uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      const errorMessage = "\uC8C4\uC1A1\uD569\uB2C8\uB2E4. \uC751\uB2F5\uC744 \uC0DD\uC131\uD558\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
      this.addMessage("assistant", errorMessage);
      return errorMessage;
    }
  }
  /**
   * 메시지 추가
   */
  addMessage(type, content) {
    this.conversation.push({
      type,
      content,
      timestamp: Date.now()
    });
    const significantMsgCount = this.conversation.filter((msg) => msg.type !== "system").length;
    if (type !== "system" && significantMsgCount >= 4) {
      this.trySaveCurrentSession();
    }
  }
  /**
   * 현재 대화 자동 저장 시도
   * 저장 로직에서 오류가 발생해도 무시
   */
  trySaveCurrentSession() {
    try {
      if (this.currentSessionId) {
        this.historyService.deleteSession(this.currentSessionId);
      }
      this.saveCurrentSession();
    } catch (error) {
      console.log("\uB300\uD654 \uC790\uB3D9 \uC800\uC7A5 \uC2E4\uD328:", error);
    }
  }
  /**
   * 시스템 메시지 추가
   */
  addSystemMessage(content) {
    this.addMessage("system", content);
  }
  /**
   * 대화 내용 초기화
   */
  clearConversation() {
    this.conversation = [];
    this.currentSessionId = null;
  }
  /**
   * 웰컴 메시지 가져오기
   */
  getWelcomeMessage() {
    return this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)] || "\uC548\uB155\uD558\uC138\uC694! APE \uCC44\uD305\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4.";
  }
  /**
   * 대화 히스토리 가져오기
   */
  getConversation() {
    return [...this.conversation];
  }
  /**
   * 현재 대화 저장하기
   * @param title 대화 제목 (옵션)
   * @returns 저장된 세션 ID
   */
  saveCurrentSession(title) {
    const hasUserMessages = this.conversation.some((msg) => msg.type === "user");
    if (!hasUserMessages || this.conversation.length < 2) {
      throw new Error("\uC800\uC7A5\uD560 \uB300\uD654\uAC00 \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    }
    const sessionTitle = title || this.generateSessionTitle();
    const sessionId = this.historyService.saveSession(sessionTitle, this.conversation);
    this.currentSessionId = sessionId;
    return sessionId;
  }
  /**
   * 세션 제목 자동 생성
   */
  generateSessionTitle() {
    const firstUserMessage = this.conversation.find((msg) => msg.type === "user");
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      return content.length > 30 ? content.substring(0, 30) + "..." : content;
    }
    return `\uB300\uD654 \uC138\uC158 ${(/* @__PURE__ */ new Date()).toLocaleString("ko-KR")}`;
  }
  /**
   * 저장된 세션 불러오기
   * @param sessionId 세션 ID
   * @returns 성공 여부
   */
  loadSession(sessionId) {
    const session = this.historyService.getSession(sessionId);
    if (!session) {
      return false;
    }
    this.conversation = [...session.messages];
    this.currentSessionId = sessionId;
    return true;
  }
  /**
   * 모든 저장된 세션 불러오기
   * @returns 저장된 모든 세션
   */
  getAllSavedSessions() {
    return this.historyService.getAllSessions();
  }
  /**
   * 날짜별로 그룹화된 세션 목록 가져오기
   * @returns 날짜별 세션 맵
   */
  getSessionsByDate() {
    return this.historyService.getSessionsByDate();
  }
  /**
   * 특정 세션 삭제
   * @param sessionId 세션 ID
   * @returns 삭제 성공 여부
   */
  deleteSession(sessionId) {
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    return this.historyService.deleteSession(sessionId);
  }
  /**
   * 모든 히스토리 삭제
   */
  clearAllHistory() {
    this.historyService.clearAllHistory();
    this.currentSessionId = null;
  }
  /**
   * 특별 명령어 처리 (문서 생성, 코드 분석 등 고급 작업용)
   */
  async processSpecialCommand(request3) {
    try {
      switch (request3.command) {
        case "generateDoc":
          this.addSystemMessage(`${request3.type} \uBB38\uC11C \uC0DD\uC131 \uC911...`);
          return await this.apeCore.processMessage(
            `\uCF54\uB4DC\uC5D0 \uB300\uD55C ${request3.type} \uBB38\uC11C\uB97C \uC0DD\uC131\uD574 \uC8FC\uC138\uC694:

\`\`\`${request3.language}
${request3.content}
\`\`\``,
            { embedDevMode: true }
          );
        case "analyzeCode":
          this.addSystemMessage(`\uCF54\uB4DC \uBD84\uC11D \uC911 (${request3.focus})...`);
          return await this.apeCore.processMessage(
            `\uB2E4\uC74C \uCF54\uB4DC\uB97C \uBD84\uC11D\uD574 \uC8FC\uC138\uC694 (\uC911\uC810: ${request3.focus}):

\`\`\`${request3.language}
${request3.content}
\`\`\``,
            { embedDevMode: true }
          );
        default:
          throw new Error(`\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uD2B9\uBCC4 \uBA85\uB839\uC5B4: ${request3.command}`);
      }
    } catch (error) {
      console.error("\uD2B9\uBCC4 \uBA85\uB839\uC5B4 \uCC98\uB9AC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return {
        content: `\uBA85\uB839\uC5B4 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`,
        error: true
      };
    }
  }
};

// src/ui/ApeTreeDataProvider.ts
var vscode6 = __toESM(require("vscode"));
console.log("ApeTreeDataProvider: \uBAA8\uB4C8 \uB85C\uB4DC\uB428");
var ApeTreeDataProvider = class {
  /**
   * 생성자
   * @param context VS Code 확장 컨텍스트
   * @param coreService 코어 서비스 인스턴스
   */
  constructor(context, coreService2) {
    this._onDidChangeTreeData = new vscode6.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.treeData = [];
    this.context = context;
    this.coreService = coreService2;
    console.log("ApeTreeDataProvider: \uC0DD\uC131\uC790 \uD638\uCD9C\uB428, ape.treeView \uC81C\uACF5\uC790 \uCD08\uAE30\uD654");
    setTimeout(() => {
      console.log("ApeTreeDataProvider: \uCD08\uAE30 \uD2B8\uB9AC \uB370\uC774\uD130 \uCD08\uAE30\uD654 \uC2DC\uC791");
      this.initializeTreeData();
      console.log("ApeTreeDataProvider: \uCD08\uAE30 \uD2B8\uB9AC \uB370\uC774\uD130 \uCD08\uAE30\uD654 \uC644\uB8CC");
    }, 1e3);
  }
  /**
   * TreeView 데이터를 초기화합니다.
   */
  initializeTreeData() {
    this.treeData = [
      {
        id: "chat",
        label: "\uCC44\uD305",
        type: "category" /* CATEGORY */,
        iconPath: new vscode6.ThemeIcon("comment"),
        contextValue: "chatCategory",
        children: [
          {
            id: "chat-current",
            label: "\uD604\uC7AC \uC138\uC158",
            type: "chat-session" /* CHAT_SESSION */,
            iconPath: new vscode6.ThemeIcon("comment-discussion"),
            contextValue: "chatSession",
            description: "\uC9C4\uD589 \uC911\uC778 \uB300\uD654"
          },
          {
            id: "chat-history",
            label: "\uD788\uC2A4\uD1A0\uB9AC",
            type: "chat-history" /* CHAT_HISTORY */,
            iconPath: new vscode6.ThemeIcon("history"),
            contextValue: "chatHistory",
            children: this.getChatHistoryItems()
          }
        ]
      },
      {
        id: "commands",
        label: "\uBA85\uB839\uC5B4",
        type: "command-root" /* COMMAND_ROOT */,
        iconPath: new vscode6.ThemeIcon("terminal"),
        contextValue: "commandRoot",
        children: this.getCommandDomainItems()
      },
      {
        id: "vault",
        label: "\uC9C0\uC2DD \uC800\uC7A5\uC18C",
        type: "vault-root" /* VAULT_ROOT */,
        iconPath: new vscode6.ThemeIcon("library"),
        contextValue: "vaultRoot",
        children: this.getVaultItems()
      },
      {
        id: "swdp",
        label: "SWDP \uD3EC\uD138",
        type: "swdp-root" /* SWDP_ROOT */,
        iconPath: new vscode6.ThemeIcon("organization"),
        contextValue: "swdpRoot",
        children: this.getSwdpItems()
      },
      {
        id: "rules",
        label: "\uD504\uB86C\uD504\uD2B8 \uB8F0",
        type: "rule-root" /* RULE_ROOT */,
        iconPath: new vscode6.ThemeIcon("law"),
        contextValue: "ruleRoot",
        children: this.getRuleItems()
      },
      {
        id: "settings",
        label: "\uC124\uC815",
        type: "settings-root" /* SETTINGS_ROOT */,
        iconPath: new vscode6.ThemeIcon("gear"),
        contextValue: "settingsRoot",
        children: this.getSettingsItems()
      }
    ];
  }
  /**
   * 채팅 히스토리 아이템을 가져옵니다.
   * @returns 채팅 히스토리 트리 아이템 배열
   */
  getChatHistoryItems() {
    try {
      const chatService2 = container.get("chatService");
      if (!chatService2) {
        console.error("ApeTreeDataProvider: ChatService\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
        return this.getPlaceholderHistoryItems();
      }
      const sessionsByDate = chatService2.getSessionsByDate();
      if (!sessionsByDate || sessionsByDate.size === 0) {
        return [{
          id: "chat-history-empty",
          label: "\uB300\uD654 \uAE30\uB85D \uC5C6\uC74C",
          type: "chat-history" /* CHAT_HISTORY */,
          iconPath: new vscode6.ThemeIcon("info"),
          contextValue: "chatHistoryEmpty",
          description: "\uC800\uC7A5\uB41C \uB300\uD654\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4"
        }];
      }
      const historyItems = [];
      if (sessionsByDate.has("today")) {
        const todaySessions = sessionsByDate.get("today") || [];
        historyItems.push({
          id: "chat-history-today",
          label: `\uC624\uB298 (${todaySessions.length} \uC138\uC158)`,
          type: "chat-history" /* CHAT_HISTORY */,
          iconPath: new vscode6.ThemeIcon("calendar"),
          contextValue: "chatHistoryDay",
          children: todaySessions.map((session) => this.createSessionTreeItem(session, true))
        });
      }
      if (sessionsByDate.has("yesterday")) {
        const yesterdaySessions = sessionsByDate.get("yesterday") || [];
        historyItems.push({
          id: "chat-history-yesterday",
          label: `\uC5B4\uC81C (${yesterdaySessions.length} \uC138\uC158)`,
          type: "chat-history" /* CHAT_HISTORY */,
          iconPath: new vscode6.ThemeIcon("calendar"),
          contextValue: "chatHistoryDay",
          children: yesterdaySessions.map((session) => this.createSessionTreeItem(session, false))
        });
      }
      for (const [dateKey, sessions] of sessionsByDate.entries()) {
        if (dateKey !== "today" && dateKey !== "yesterday" && sessions.length > 0) {
          historyItems.push({
            id: `chat-history-${dateKey}`,
            label: `${dateKey} (${sessions.length} \uC138\uC158)`,
            type: "chat-history" /* CHAT_HISTORY */,
            iconPath: new vscode6.ThemeIcon("calendar"),
            contextValue: "chatHistoryDay",
            children: sessions.map((session) => this.createSessionTreeItem(session, false))
          });
        }
      }
      return historyItems;
    } catch (error) {
      console.error("ApeTreeDataProvider: \uCC44\uD305 \uD788\uC2A4\uD1A0\uB9AC \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return this.getPlaceholderHistoryItems();
    }
  }
  /**
   * 세션 객체로부터 트리 아이템 생성
   */
  createSessionTreeItem(session, isToday) {
    const time = new Date(session.timestamp).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const description = isToday ? `\uC624\uB298 ${time}` : time;
    return {
      id: session.id,
      label: session.title,
      type: "chat-session" /* CHAT_SESSION */,
      iconPath: new vscode6.ThemeIcon("comment"),
      description,
      contextValue: "chatHistorySession",
      metadata: {
        sessionId: session.id,
        timestamp: session.timestamp,
        messageCount: session.messages?.length || 0
      }
    };
  }
  /**
   * 기본 히스토리 아이템 (로딩 실패시)
   */
  getPlaceholderHistoryItems() {
    return [
      {
        id: "chat-history-loading",
        label: "\uB300\uD654 \uAE30\uB85D \uB85C\uB529 \uC911...",
        type: "chat-history" /* CHAT_HISTORY */,
        iconPath: new vscode6.ThemeIcon("loading~spin"),
        contextValue: "chatHistoryLoading"
      }
    ];
  }
  /**
   * 명령어 도메인 아이템을 가져옵니다.
   * @returns 명령어 도메인 트리 아이템 배열
   */
  getCommandDomainItems() {
    const commandRegistry = this.coreService?.commandRegistry;
    const domains = [];
    if (!commandRegistry) {
      console.log("ApeTreeDataProvider: commandRegistry\uAC00 \uCD08\uAE30\uD654\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uAE30\uBCF8 \uBA85\uB839\uC5B4 \uB3C4\uBA54\uC778 \uBC18\uD658");
      return [{
        id: "commands-not-ready",
        label: "\uBA85\uB839\uC5B4 \uB85C\uB529 \uC911...",
        type: "command-domain" /* COMMAND_DOMAIN */,
        iconPath: new vscode6.ThemeIcon("loading~spin"),
        contextValue: "commandLoading",
        description: "\uBA85\uB839\uC5B4 \uC2DC\uC2A4\uD15C \uCD08\uAE30\uD654 \uC911",
        children: []
      }];
    }
    const systemCommandItem = {
      id: "commands-system",
      label: "\uC2DC\uC2A4\uD15C \uBA85\uB839\uC5B4",
      type: "command-domain" /* COMMAND_DOMAIN */,
      iconPath: new vscode6.ThemeIcon("settings-gear"),
      contextValue: "commandDomain",
      description: "/\uB85C \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4",
      children: []
    };
    try {
      const systemCommands = commandRegistry.getAllSystemCommandUsages() || [];
      systemCommandItem.children = systemCommands.map((cmd) => ({
        id: `command-${cmd.command}`,
        label: cmd.command,
        type: "command" /* COMMAND */,
        description: cmd.description,
        iconPath: new vscode6.ThemeIcon("terminal"),
        contextValue: "command",
        metadata: {
          syntax: cmd.syntax,
          examples: cmd.examples,
          agentId: cmd.agentId
        }
      }));
    } catch (error) {
      console.error("ApeTreeDataProvider: \uC2DC\uC2A4\uD15C \uBA85\uB839\uC5B4 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      systemCommandItem.children = [{
        id: "commands-system-error",
        label: "\uBA85\uB839\uC5B4 \uB85C\uB4DC \uC624\uB958",
        type: "command" /* COMMAND */,
        description: "\uBA85\uB839\uC5B4\uB97C \uB85C\uB4DC\uD558\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
        iconPath: new vscode6.ThemeIcon("error"),
        contextValue: "commandError"
      }];
    }
    domains.push(systemCommandItem);
    domains.push({
      id: "commands-git",
      label: "Git \uBA85\uB839\uC5B4",
      type: "command-domain" /* COMMAND_DOMAIN */,
      iconPath: new vscode6.ThemeIcon("git-merge"),
      contextValue: "commandDomain",
      description: "@git:\uB85C \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4",
      children: this.getCommandsForDomain("git" /* GIT */)
    });
    domains.push({
      id: "commands-doc",
      label: "\uBB38\uC11C \uBA85\uB839\uC5B4",
      type: "command-domain" /* COMMAND_DOMAIN */,
      iconPath: new vscode6.ThemeIcon("book"),
      contextValue: "commandDomain",
      description: "@doc:\uB85C \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4",
      children: this.getCommandsForDomain("doc" /* DOC */)
    });
    domains.push({
      id: "commands-jira",
      label: "Jira \uBA85\uB839\uC5B4",
      type: "command-domain" /* COMMAND_DOMAIN */,
      iconPath: new vscode6.ThemeIcon("issues"),
      contextValue: "commandDomain",
      description: "@jira:\uB85C \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4",
      children: this.getCommandsForDomain("jira" /* JIRA */)
    });
    domains.push({
      id: "commands-pocket",
      label: "Pocket \uBA85\uB839\uC5B4",
      type: "command-domain" /* COMMAND_DOMAIN */,
      iconPath: new vscode6.ThemeIcon("archive"),
      contextValue: "commandDomain",
      description: "@pocket:\uB85C \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4",
      children: this.getCommandsForDomain("pocket" /* POCKET */)
    });
    domains.push({
      id: "commands-vault",
      label: "Vault \uBA85\uB839\uC5B4",
      type: "command-domain" /* COMMAND_DOMAIN */,
      iconPath: new vscode6.ThemeIcon("database"),
      contextValue: "commandDomain",
      description: "@vault:\uB85C \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4",
      children: this.getCommandsForDomain("vault" /* VAULT */)
    });
    domains.push({
      id: "commands-rules",
      label: "Rules \uBA85\uB839\uC5B4",
      type: "command-domain" /* COMMAND_DOMAIN */,
      iconPath: new vscode6.ThemeIcon("law"),
      contextValue: "commandDomain",
      description: "@rules:\uB85C \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4",
      children: this.getCommandsForDomain("rules" /* RULES */)
    });
    domains.push({
      id: "commands-swdp",
      label: "SWDP \uBA85\uB839\uC5B4",
      type: "command-domain" /* COMMAND_DOMAIN */,
      iconPath: new vscode6.ThemeIcon("organization"),
      contextValue: "commandDomain",
      description: "@swdp:\uB85C \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4",
      children: this.getCommandsForDomain("swdp" /* SWDP */)
    });
    return domains;
  }
  /**
   * 특정 도메인의 명령어를 가져옵니다.
   * @param domain 명령어 도메인
   * @returns 해당 도메인의 명령어 트리 아이템 배열
   */
  getCommandsForDomain(domain) {
    try {
      const commandRegistry = this.coreService?.commandRegistry;
      if (!commandRegistry) {
        console.log(`ApeTreeDataProvider: ${domain} \uB3C4\uBA54\uC778 \uBA85\uB839\uC5B4 \uB85C\uB4DC \uC2E4\uD328 - commandRegistry\uAC00 \uCD08\uAE30\uD654\uB418\uC9C0 \uC54A\uC74C`);
        return [{
          id: `command-${domain}-loading`,
          label: "\uB85C\uB529 \uC911...",
          type: "command" /* COMMAND */,
          description: "\uBA85\uB839\uC5B4 \uB85C\uB4DC \uC911",
          iconPath: new vscode6.ThemeIcon("loading~spin"),
          contextValue: "commandLoading"
        }];
      }
      const domainCommands = commandRegistry.getDomainCommands(domain) || [];
      return domainCommands.map((cmd) => ({
        id: `command-${domain}-${cmd.command}`,
        label: cmd.command,
        type: "command" /* COMMAND */,
        description: cmd.description,
        iconPath: new vscode6.ThemeIcon("terminal"),
        contextValue: "command",
        metadata: {
          syntax: cmd.syntax,
          examples: cmd.examples,
          domain,
          agentId: cmd.agentId
        }
      }));
    } catch (error) {
      console.error(`ApeTreeDataProvider: ${domain} \uB3C4\uBA54\uC778 \uBA85\uB839\uC5B4 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:`, error);
      return [{
        id: `command-${domain}-error`,
        label: "\uBA85\uB839\uC5B4 \uB85C\uB4DC \uC624\uB958",
        type: "command" /* COMMAND */,
        description: "\uBA85\uB839\uC5B4\uB97C \uB85C\uB4DC\uD558\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
        iconPath: new vscode6.ThemeIcon("error"),
        contextValue: "commandError"
      }];
    }
  }
  /**
   * 지식 저장소 아이템을 가져옵니다.
   * @returns 지식 저장소 트리 아이템 배열
   */
  getVaultItems() {
    return [
      {
        id: "vault-coding",
        label: "\uCF54\uB529 \uAC00\uC774\uB4DC",
        type: "vault-folder" /* VAULT_FOLDER */,
        iconPath: new vscode6.ThemeIcon("folder"),
        contextValue: "vaultFolder",
        children: [
          {
            id: "vault-doc-1",
            label: "TypeScript \uC2A4\uD0C0\uC77C \uAC00\uC774\uB4DC",
            type: "vault-document" /* VAULT_DOCUMENT */,
            iconPath: new vscode6.ThemeIcon("file-text"),
            contextValue: "vaultDocument",
            description: "2024-05-01"
          },
          {
            id: "vault-doc-2",
            label: "VS Code API \uC0AC\uC6A9\uBC95",
            type: "vault-document" /* VAULT_DOCUMENT */,
            iconPath: new vscode6.ThemeIcon("file-text"),
            contextValue: "vaultDocument",
            description: "2024-04-28"
          }
        ]
      },
      {
        id: "vault-project",
        label: "\uD504\uB85C\uC81D\uD2B8 \uBB38\uC11C",
        type: "vault-folder" /* VAULT_FOLDER */,
        iconPath: new vscode6.ThemeIcon("folder"),
        contextValue: "vaultFolder",
        children: [
          {
            id: "vault-doc-3",
            label: "APE \uC544\uD0A4\uD14D\uCC98 \uBB38\uC11C",
            type: "vault-document" /* VAULT_DOCUMENT */,
            iconPath: new vscode6.ThemeIcon("file-text"),
            contextValue: "vaultDocument",
            description: "2024-05-03"
          }
        ]
      }
    ];
  }
  /**
   * 프롬프트 룰 아이템을 가져옵니다.
   * @returns 프롬프트 룰 트리 아이템 배열
   */
  getRuleItems() {
    return [
      {
        id: "rule-1",
        label: "\uCF54\uB4DC \uC2A4\uD0C0\uC77C \uB8F0",
        type: "rule" /* RULE */,
        iconPath: new vscode6.ThemeIcon("symbol-interface"),
        contextValue: "rule",
        description: "\uD65C\uC131\uD654\uB428"
      },
      {
        id: "rule-2",
        label: "\uBB38\uC11C\uD654 \uB8F0",
        type: "rule" /* RULE */,
        iconPath: new vscode6.ThemeIcon("symbol-interface"),
        contextValue: "rule",
        description: "\uD65C\uC131\uD654\uB428"
      },
      {
        id: "rule-3",
        label: "\uD14C\uC2A4\uD2B8 \uC791\uC131 \uB8F0",
        type: "rule" /* RULE */,
        iconPath: new vscode6.ThemeIcon("symbol-interface"),
        contextValue: "rule",
        description: "\uBE44\uD65C\uC131\uD654\uB428"
      }
    ];
  }
  /**
   * 설정 아이템을 가져옵니다.
   * @returns 설정 트리 아이템 배열
   */
  getSettingsItems() {
    return [
      {
        id: "settings-open",
        label: "\uC124\uC815 \uC5F4\uAE30",
        type: "settings-item" /* SETTINGS_ITEM */,
        iconPath: new vscode6.ThemeIcon("gear"),
        contextValue: "settingsOpen",
        description: "\uC124\uC815 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9",
        metadata: {
          command: "ape.openSettings",
          title: "\uC124\uC815 \uC5F4\uAE30"
        }
      },
      {
        id: "settings-llm",
        label: "LLM \uC124\uC815",
        type: "settings-category" /* SETTINGS_CATEGORY */,
        iconPath: new vscode6.ThemeIcon("dashboard"),
        contextValue: "settingsCategory",
        children: [
          {
            id: "settings-llm-model",
            label: "\uAE30\uBCF8 \uBAA8\uB378",
            type: "settings-item" /* SETTINGS_ITEM */,
            iconPath: new vscode6.ThemeIcon("symbol-parameter"),
            contextValue: "settingsItem",
            description: this.getConfigValue("ape.llm.defaultModel")
          },
          {
            id: "settings-llm-streaming",
            label: "\uC2A4\uD2B8\uB9AC\uBC0D \uC9C0\uC6D0",
            type: "settings-item" /* SETTINGS_ITEM */,
            iconPath: new vscode6.ThemeIcon("symbol-parameter"),
            contextValue: "settingsItem",
            description: this.getConfigValue("ape.llm.supportsStreaming") === "true" ? "\uD65C\uC131\uD654\uB428" : "\uBE44\uD65C\uC131\uD654\uB428"
          }
        ]
      },
      {
        id: "settings-core",
        label: "\uCF54\uC5B4 \uC124\uC815",
        type: "settings-category" /* SETTINGS_CATEGORY */,
        iconPath: new vscode6.ThemeIcon("gear"),
        contextValue: "settingsCategory",
        children: [
          {
            id: "settings-core-ssl",
            label: "SSL \uC6B0\uD68C",
            type: "settings-item" /* SETTINGS_ITEM */,
            iconPath: new vscode6.ThemeIcon("symbol-parameter"),
            contextValue: "settingsItem",
            description: this.getConfigValue("ape.core.sslBypass") === "true" ? "\uD65C\uC131\uD654\uB428" : "\uBE44\uD65C\uC131\uD654\uB428"
          },
          {
            id: "settings-core-log",
            label: "\uB85C\uADF8 \uB808\uBCA8",
            type: "settings-item" /* SETTINGS_ITEM */,
            iconPath: new vscode6.ThemeIcon("symbol-parameter"),
            contextValue: "settingsItem",
            description: this.getConfigValue("ape.core.logLevel")
          }
        ]
      }
    ];
  }
  /**
   * VS Code 설정에서 값을 가져옵니다.
   * @param key 설정 키
   * @returns 설정 값 (문자열로 변환)
   */
  getConfigValue(key) {
    const config = vscode6.workspace.getConfiguration();
    const value = config.get(key);
    return value !== void 0 ? String(value) : "\uC124\uC815\uB418\uC9C0 \uC54A\uC74C";
  }
  /**
   * TreeView를 새로고침합니다.
   */
  refresh() {
    console.log("ApeTreeDataProvider: \uD2B8\uB9AC\uBDF0 \uC0C8\uB85C\uACE0\uCE68 \uC2DC\uC791");
    try {
      this.initializeTreeData();
      console.log("ApeTreeDataProvider: \uD2B8\uB9AC \uB370\uC774\uD130 \uCD08\uAE30\uD654 \uC644\uB8CC");
      this._onDidChangeTreeData.fire(void 0);
      console.log("ApeTreeDataProvider: TreeView \uC5C5\uB370\uC774\uD2B8 \uC774\uBCA4\uD2B8 \uBC1C\uC0DD \uC644\uB8CC");
    } catch (error) {
      console.error("ApeTreeDataProvider: \uC0C8\uB85C\uACE0\uCE68 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
    }
  }
  /**
   * TreeItem 요소를 가져옵니다.
   * @param element TreeView 아이템
   * @returns VS Code TreeItem 인스턴스
   */
  getTreeItem(element) {
    const treeItem = new vscode6.TreeItem(
      element.label,
      element.children && element.children.length > 0 ? vscode6.TreeItemCollapsibleState.Collapsed : vscode6.TreeItemCollapsibleState.None
    );
    treeItem.description = element.description || "";
    treeItem.tooltip = element.tooltip || element.description || element.label;
    treeItem.contextValue = element.contextValue || "";
    if (element.iconPath) {
      treeItem.iconPath = element.iconPath;
    }
    if (element.metadata) {
      if (element.contextValue === "settingsOpen") {
        treeItem.command = {
          command: element.metadata.command,
          title: element.metadata.title || "\uC124\uC815 \uC5F4\uAE30"
        };
      } else if (element.type === "command" /* COMMAND */) {
        treeItem.command = {
          command: "ape.showCommandDetails",
          title: "\uBA85\uB839\uC5B4 \uC138\uBD80\uC815\uBCF4 \uBCF4\uAE30",
          arguments: [element]
        };
      }
    }
    return treeItem;
  }
  /**
   * 아이템의 자식 요소를 가져옵니다.
   * @param element TreeView 아이템 (없으면 루트 아이템)
   * @returns 자식 아이템 배열 또는 null
   */
  getChildren(element) {
    if (!element) {
      return this.treeData;
    }
    return element.children || [];
  }
  /**
   * SWDP 포털 아이템을 가져옵니다.
   * @returns SWDP 트리 아이템 배열
   */
  getSwdpItems() {
    try {
      const swdpEnabled = vscode6.workspace.getConfiguration("ape").get("swdp.enabled", true);
      if (!swdpEnabled) {
        return [{
          id: "swdp-disabled",
          label: "SWDP \uAE30\uB2A5\uC774 \uBE44\uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
          type: "swdp-root" /* SWDP_ROOT */,
          iconPath: new vscode6.ThemeIcon("warning"),
          contextValue: "swdpDisabled"
        }];
      }
      try {
        const swdpDomainService = SwdpDomainService.getInstance();
        const isInitialized = swdpDomainService.isInitialized();
        if (!isInitialized) {
          return [{
            id: "swdp-not-initialized",
            label: "SWDP \uC11C\uBE44\uC2A4 \uCD08\uAE30\uD654 \uC911...",
            type: "swdp-root" /* SWDP_ROOT */,
            iconPath: new vscode6.ThemeIcon("loading~spin"),
            contextValue: "swdpLoading"
          }];
        }
        const projects = swdpDomainService.getCachedProjects() || [];
        if (projects.length === 0) {
          return [{
            id: "swdp-no-projects",
            label: "\uD504\uB85C\uC81D\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
            type: "swdp-root" /* SWDP_ROOT */,
            iconPath: new vscode6.ThemeIcon("info"),
            contextValue: "swdpNoProjects",
            description: "\uC0C8\uB85C\uACE0\uCE68\uD558\uC5EC \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694"
          }];
        }
        return projects.map((project) => ({
          id: `swdp-project-${project.code}`,
          label: project.name,
          type: "swdp-project" /* SWDP_PROJECT */,
          iconPath: new vscode6.ThemeIcon("project"),
          contextValue: "swdpProject",
          description: project.description || "",
          metadata: {
            projectId: project.code,
            projectKey: project.code
          },
          children: [
            {
              id: `swdp-tasks-${project.code}`,
              label: "\uC791\uC5C5",
              type: "swdp-root" /* SWDP_ROOT */,
              iconPath: new vscode6.ThemeIcon("tasklist"),
              contextValue: "swdpTasksFolder",
              description: "\uD504\uB85C\uC81D\uD2B8 \uC791\uC5C5"
            },
            {
              id: `swdp-documents-${project.code}`,
              label: "\uBB38\uC11C",
              type: "swdp-root" /* SWDP_ROOT */,
              iconPath: new vscode6.ThemeIcon("file-text"),
              contextValue: "swdpDocsFolder",
              description: "\uD504\uB85C\uC81D\uD2B8 \uBB38\uC11C"
            },
            {
              id: `swdp-builds-${project.code}`,
              label: "\uBE4C\uB4DC",
              type: "swdp-root" /* SWDP_ROOT */,
              iconPath: new vscode6.ThemeIcon("package"),
              contextValue: "swdpBuildsFolder",
              description: "\uD504\uB85C\uC81D\uD2B8 \uBE4C\uB4DC"
            }
          ]
        }));
      } catch (error) {
        console.error("SWDP \uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328:", error);
        return [{
          id: "swdp-error",
          label: "SWDP \uC5F0\uACB0 \uC624\uB958",
          type: "swdp-root" /* SWDP_ROOT */,
          iconPath: new vscode6.ThemeIcon("error"),
          contextValue: "swdpError",
          description: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"
        }];
      }
    } catch (error) {
      console.error("SWDP \uD2B8\uB9AC \uAD6C\uC131 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      return [{
        id: "swdp-error",
        label: "SWDP \uB370\uC774\uD130 \uB85C\uB4DC \uC624\uB958",
        type: "swdp-root" /* SWDP_ROOT */,
        iconPath: new vscode6.ThemeIcon("error"),
        contextValue: "swdpError",
        description: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"
      }];
    }
  }
  /**
   * 특정 아이템의 부모를 가져옵니다.
   * @param element TreeView 아이템
   * @returns 부모 아이템 또는 null
   */
  getParent(element) {
    return null;
  }
};

// src/ui/ApeFileExplorerProvider.ts
var vscode7 = __toESM(require("vscode"));
var fs4 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
var import_util = require("util");
var readdir2 = (0, import_util.promisify)(fs4.readdir);
var stat2 = (0, import_util.promisify)(fs4.stat);
var mkdir2 = (0, import_util.promisify)(fs4.mkdir);
var writeFile2 = (0, import_util.promisify)(fs4.writeFile);
var unlink2 = (0, import_util.promisify)(fs4.unlink);
var rmdir2 = (0, import_util.promisify)(fs4.rmdir);
var rename2 = (0, import_util.promisify)(fs4.rename);
var ApeFileExplorerProvider = class {
  /**
   * 생성자
   * @param context VS Code 확장 컨텍스트
   */
  constructor(context) {
    this.context = context;
    this._onDidChangeTreeData = new vscode7.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this._workspaceRoot = vscode7.workspace.workspaceFolders && vscode7.workspace.workspaceFolders.length > 0 ? vscode7.workspace.workspaceFolders[0].uri.fsPath : void 0;
    this._setupWatcher();
  }
  /**
   * 파일 시스템 감시자 설정
   */
  _setupWatcher() {
    if (!this._workspaceRoot)
      return;
    this._dirWatcher = vscode7.workspace.createFileSystemWatcher("**/*");
    this._dirWatcher.onDidCreate(() => {
      this.refresh();
    });
    this._dirWatcher.onDidDelete(() => {
      this.refresh();
    });
    this._dirWatcher.onDidChange(() => {
      this.refresh();
    });
  }
  /**
   * 트리 데이터 갱신
   */
  refresh() {
    this._onDidChangeTreeData.fire(void 0);
  }
  /**
   * TreeItem 요소를 가져옵니다.
   * @param element 파일 항목
   * @returns VS Code TreeItem 인스턴스
   */
  getTreeItem(element) {
    return element;
  }
  /**
   * 자식 요소를 가져옵니다.
   * @param element 파일 항목 (없으면 루트 항목)
   * @returns 자식 파일 항목 배열
   */
  async getChildren(element) {
    if (!this._workspaceRoot) {
      vscode7.window.showInformationMessage("\uD30C\uC77C \uD0D0\uC0C9\uC744 \uC704\uD574 \uD3F4\uB354\uB97C \uC5F4\uC5B4\uC8FC\uC138\uC694.");
      return [];
    }
    if (element) {
      return this._getFileItems(element.path);
    } else {
      return this._getFileItems(this._workspaceRoot);
    }
  }
  /**
   * 특정 경로의 파일 항목 목록을 가져옵니다.
   * @param dirPath 디렉토리 경로
   * @returns 파일 항목 배열
   */
  async _getFileItems(dirPath) {
    try {
      const files = await readdir2(dirPath);
      const fileItems = await Promise.all(files.map(async (file) => {
        const filePath = path3.join(dirPath, file);
        const fileStat = await stat2(filePath);
        const isDirectory = fileStat.isDirectory();
        const item = {
          label: file,
          path: filePath,
          type: isDirectory ? "directory" /* DIRECTORY */ : "file" /* FILE */,
          isDirectory,
          collapsibleState: isDirectory ? vscode7.TreeItemCollapsibleState.Collapsed : vscode7.TreeItemCollapsibleState.None,
          contextValue: isDirectory ? "directory" : "file",
          iconPath: this._getIconPath(file, isDirectory)
        };
        if (!isDirectory) {
          item.command = {
            command: "ape.openFile",
            title: "\uD30C\uC77C \uC5F4\uAE30",
            arguments: [filePath]
          };
        }
        return item;
      }));
      return fileItems.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) {
          return -1;
        }
        if (!a.isDirectory && b.isDirectory) {
          return 1;
        }
        return a.label.localeCompare(b.label);
      });
    } catch (error) {
      console.error(`\uB514\uB809\uD1A0\uB9AC \uC77D\uAE30 \uC624\uB958 (${dirPath}):`, error);
      return [];
    }
  }
  /**
   * 파일/폴더 아이콘 경로를 가져옵니다.
   * @param filename 파일 이름
   * @param isDirectory 디렉토리 여부
   * @returns 아이콘 경로 또는 ThemeIcon
   */
  _getIconPath(filename, isDirectory) {
    if (isDirectory) {
      return new vscode7.ThemeIcon("folder");
    }
    const ext = path3.extname(filename).toLowerCase();
    switch (ext) {
      case ".js":
        return new vscode7.ThemeIcon("javascript");
      case ".ts":
        return new vscode7.ThemeIcon("typescript");
      case ".json":
        return new vscode7.ThemeIcon("json");
      case ".html":
        return new vscode7.ThemeIcon("html");
      case ".css":
        return new vscode7.ThemeIcon("css");
      case ".md":
        return new vscode7.ThemeIcon("markdown");
      case ".py":
        return new vscode7.ThemeIcon("python");
      case ".java":
        return new vscode7.ThemeIcon("java");
      case ".php":
        return new vscode7.ThemeIcon("php");
      case ".c":
      case ".cpp":
      case ".h":
        return new vscode7.ThemeIcon("c");
      case ".go":
        return new vscode7.ThemeIcon("go");
      case ".rb":
        return new vscode7.ThemeIcon("ruby");
      case ".sh":
        return new vscode7.ThemeIcon("terminal");
      case ".bat":
      case ".cmd":
        return new vscode7.ThemeIcon("terminal-cmd");
      case ".sql":
        return new vscode7.ThemeIcon("database");
      case ".jpg":
      case ".jpeg":
      case ".png":
      case ".gif":
      case ".svg":
        return new vscode7.ThemeIcon("image");
      default:
        return new vscode7.ThemeIcon("file");
    }
  }
  /**
   * 파일 또는 폴더 생성
   * @param parentPath 부모 디렉토리 경로
   * @param type 생성할 항목 유형 (파일 또는 폴더)
   */
  async createFileOrFolder(parentPath, type) {
    try {
      const baseName = type === "directory" /* DIRECTORY */ ? "\uC0C8 \uD3F4\uB354" : "\uC0C8 \uD30C\uC77C.txt";
      const inputOptions = {
        prompt: `${type === "directory" /* DIRECTORY */ ? "\uD3F4\uB354" : "\uD30C\uC77C"} \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694`,
        value: baseName
      };
      const fileName = await vscode7.window.showInputBox(inputOptions);
      if (!fileName)
        return;
      const newPath = path3.join(parentPath, fileName);
      if (type === "directory" /* DIRECTORY */) {
        await mkdir2(newPath);
      } else {
        await writeFile2(newPath, "");
        const document = await vscode7.workspace.openTextDocument(newPath);
        await vscode7.window.showTextDocument(document);
      }
      this.refresh();
    } catch (error) {
      console.error("\uD30C\uC77C/\uD3F4\uB354 \uC0DD\uC131 \uC624\uB958:", error);
      vscode7.window.showErrorMessage(`${type === "directory" /* DIRECTORY */ ? "\uD3F4\uB354" : "\uD30C\uC77C"} \uC0DD\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.`);
    }
  }
  /**
   * 파일 또는 폴더 삭제
   * @param itemPath 삭제할 항목 경로
   * @param isDirectory 디렉토리 여부
   */
  async deleteFileOrFolder(itemPath, isDirectory) {
    try {
      const itemName = path3.basename(itemPath);
      const confirmMessage = isDirectory ? `\uD3F4\uB354 '${itemName}'\uC640 \uADF8 \uB0B4\uC6A9\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?` : `\uD30C\uC77C '${itemName}'\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`;
      const confirmOptions = {
        modal: true,
        detail: "\uC774 \uC791\uC5C5\uC740 \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      };
      const confirmed = await vscode7.window.showWarningMessage(
        confirmMessage,
        confirmOptions,
        "\uC0AD\uC81C"
      );
      if (confirmed !== "\uC0AD\uC81C") {
        return;
      }
      if (isDirectory) {
        await this._removeDirectoryRecursive(itemPath);
      } else {
        await unlink2(itemPath);
      }
      this.refresh();
    } catch (error) {
      console.error("\uC0AD\uC81C \uC624\uB958:", error);
      vscode7.window.showErrorMessage("\uD56D\uBAA9 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }
  /**
   * 재귀적으로 디렉토리 삭제
   * @param dirPath 삭제할 디렉토리 경로
   */
  async _removeDirectoryRecursive(dirPath) {
    try {
      const entries = await readdir2(dirPath);
      for (const entry of entries) {
        const entryPath = path3.join(dirPath, entry);
        const entryStat = await stat2(entryPath);
        if (entryStat.isDirectory()) {
          await this._removeDirectoryRecursive(entryPath);
        } else {
          await unlink2(entryPath);
        }
      }
      await rmdir2(dirPath);
    } catch (error) {
      console.error(`\uB514\uB809\uD1A0\uB9AC \uC0AD\uC81C \uC624\uB958 (${dirPath}):`, error);
      throw error;
    }
  }
  /**
   * 파일 또는 폴더 이름 변경
   * @param itemPath 이름을 변경할 항목 경로
   */
  async renameFileOrFolder(itemPath) {
    try {
      const dirName = path3.dirname(itemPath);
      const baseName = path3.basename(itemPath);
      const inputOptions = {
        prompt: "\uC0C8 \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694",
        value: baseName
      };
      const newName = await vscode7.window.showInputBox(inputOptions);
      if (!newName || newName === baseName) {
        return;
      }
      const newPath = path3.join(dirName, newName);
      try {
        await stat2(newPath);
        vscode7.window.showErrorMessage(`'${newName}'\uC740 \uC774\uBBF8 \uC874\uC7AC\uD569\uB2C8\uB2E4.`);
        return;
      } catch (e) {
      }
      await rename2(itemPath, newPath);
      this.refresh();
    } catch (error) {
      console.error("\uC774\uB984 \uBCC0\uACBD \uC624\uB958:", error);
      vscode7.window.showErrorMessage("\uC774\uB984 \uBCC0\uACBD \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }
  /**
   * 부모 항목 조회 (선택적 구현)
   */
  getParent(element) {
    const parentPath = path3.dirname(element.path);
    if (parentPath === element.path) {
      return null;
    }
    return {
      label: path3.basename(parentPath),
      path: parentPath,
      type: "directory" /* DIRECTORY */,
      isDirectory: true,
      collapsibleState: vscode7.TreeItemCollapsibleState.Collapsed,
      contextValue: "directory",
      iconPath: new vscode7.ThemeIcon("folder")
    };
  }
};

// src/ui/ApeSettingsViewProvider.ts
var vscode8 = __toESM(require("vscode"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var ApeSettingsViewProvider = class {
  /**
   * Constructor for ApeSettingsViewProvider
   * 
   * @param extensionUri The URI of the extension
   * @param configService The configuration service
   * @param vscodeService The VS Code service
   */
  constructor(extensionUri, configService, vscodeService) {
    this._extensionUri = extensionUri;
    this._configService = configService;
    this._vscodeService = vscodeService;
    this._vsCodeConfig = vscode8.workspace.getConfiguration("ape");
  }
  /**
   * Resolves the webview view
   * 
   * @param webviewView The webview view to resolve
   */
  resolveWebviewView(webviewView, _context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this._handleWebviewMessage(message);
    });
  }
  /**
   * Handles messages from any webview (panel or view)
   * 
   * @param message The message from the webview
   */
  async _handleWebviewMessage(message) {
    switch (message.command) {
      case "saveUserInfo":
        await this._handleSaveUserInfo(message.userInfo);
        break;
      case "savePluginSettings":
        await this._handleSavePluginSettings(message.pluginSettings);
        break;
      case "saveApiEndpoints":
        await this._handleSaveApiEndpoints(message.apiEndpoints);
        break;
      case "saveLlmSettings":
        await this._handleSaveLlmSettings(message.llmSettings);
        break;
      case "saveModels":
        await this._handleSaveModels(message.models);
        break;
      case "getSettings":
        if (this._view) {
          await this._sendCurrentSettings();
        }
        break;
      case "addPlugin":
        await this._handleAddPlugin(message.pluginInfo);
        break;
      case "removePlugin":
        await this._handleRemovePlugin(message.pluginId);
        break;
    }
  }
  /**
   * Gets the current settings and sends them to the webview
   * 
   * @param webview Optional webview to send settings to (if not the view)
   */
  async _sendCurrentSettings(webview) {
    const targetWebview = webview || (this._view ? this._view.webview : void 0);
    if (!targetWebview) {
      return;
    }
    this._vsCodeConfig = vscode8.workspace.getConfiguration("ape");
    const config = this._configService.getAppConfig();
    const userInfo = {
      displayName: config["user"] ? config["user"]["displayName"] || "" : "",
      email: config["user"] ? config["user"]["email"] || "" : "",
      gitUsername: config["git"] ? config["git"]["username"] || "" : "",
      gitEmail: config["git"] ? config["git"]["email"] || "" : "",
      swdpUsername: config["swdp"] ? config["swdp"]["username"] || "" : "",
      swdpTeam: config["swdp"] ? config["swdp"]["team"] || "" : ""
    };
    const plugins = config["plugins"] || [];
    const apiEndpoints = {
      llmEndpoint: config["endpoints"] ? config["endpoints"]["llm"] || "" : "",
      gitApiEndpoint: config["endpoints"] ? config["endpoints"]["git"] || "" : "",
      jiraApiEndpoint: config["endpoints"] ? config["endpoints"]["jira"] || "" : "",
      swdpApiEndpoint: this._vsCodeConfig.get("swdp.baseUrl") || "http://localhost:8080",
      pocketApiEndpoint: config["endpoints"] ? config["endpoints"]["pocket"] || "" : ""
    };
    const llmSettings = {
      defaultModel: this._vsCodeConfig.get("llm.defaultModel") || "gemini-2.5-flash",
      openRouterApiKey: this._vsCodeConfig.get("llm.openrouterApiKey") || "",
      supportsStreaming: this._vsCodeConfig.get("llm.supportsStreaming") || true,
      temperature: 0.7,
      maxTokens: 4e3
    };
    const availableModels = this._vsCodeConfig.get("llm.models") || {};
    console.log("Available models:", availableModels);
    targetWebview.postMessage({
      command: "updateSettings",
      settings: {
        userInfo,
        pluginSettings: plugins,
        apiEndpoints,
        llmSettings,
        availableModels,
        coreSettings: {
          sslBypass: this._vsCodeConfig.get("core.sslBypass") || false,
          logLevel: this._vsCodeConfig.get("core.logLevel") || "info",
          allowAll: this._vsCodeConfig.get("core.allow.all") || true
        },
        swdpSettings: {
          enabled: this._vsCodeConfig.get("swdp.enabled") || true,
          baseUrl: this._vsCodeConfig.get("swdp.baseUrl") || "http://localhost:8080",
          defaultProject: this._vsCodeConfig.get("swdp.defaultProject") || ""
        }
      }
    });
  }
  /**
   * Handles saving user information
   * 
   * @param userInfo The user information to save
   */
  async _handleSaveUserInfo(userInfo) {
    await this._configService.updateConfig("app", {
      user: {
        displayName: userInfo.displayName,
        email: userInfo.email
      },
      git: {
        username: userInfo.gitUsername,
        email: userInfo.gitEmail
      },
      swdp: {
        username: userInfo.swdpUsername,
        team: userInfo.swdpTeam
      }
    });
    this._vscodeService.showInformationMessage("User information saved");
  }
  /**
   * Handles saving plugin settings
   * 
   * @param pluginSettings The plugin settings to save
   */
  async _handleSavePluginSettings(pluginSettings) {
    await this._configService.updateConfig("app", {
      plugins: pluginSettings
    });
    this._vscodeService.showInformationMessage("Plugin settings saved");
  }
  /**
   * Handles saving API endpoints
   * 
   * @param apiEndpoints The API endpoints to save
   */
  async _handleSaveApiEndpoints(apiEndpoints) {
    try {
      await this._vsCodeConfig.update("swdp.baseUrl", apiEndpoints.swdpApiEndpoint, vscode8.ConfigurationTarget.Global);
      await this._configService.updateConfig("app", {
        endpoints: {
          llm: apiEndpoints.llmEndpoint,
          git: apiEndpoints.gitApiEndpoint,
          jira: apiEndpoints.jiraApiEndpoint,
          pocket: apiEndpoints.pocketApiEndpoint
        }
      });
      this._vscodeService.showInformationMessage("API \uC5D4\uB4DC\uD3EC\uC778\uD2B8\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4");
    } catch (error) {
      console.error("API \uC5D4\uB4DC\uD3EC\uC778\uD2B8 \uC800\uC7A5 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this._vscodeService.showErrorMessage(`API \uC5D4\uB4DC\uD3EC\uC778\uD2B8 \uC800\uC7A5 \uC2E4\uD328: ${error.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`);
    }
  }
  /**
   * Handles saving LLM settings
   * 
   * @param llmSettings The LLM settings to save
   */
  async _handleSaveLlmSettings(llmSettings) {
    try {
      await this._vsCodeConfig.update("llm.defaultModel", llmSettings.defaultModel, vscode8.ConfigurationTarget.Global);
      await this._vsCodeConfig.update("llm.openrouterApiKey", llmSettings.openRouterApiKey, vscode8.ConfigurationTarget.Global);
      await this._vsCodeConfig.update("llm.supportsStreaming", llmSettings.supportsStreaming, vscode8.ConfigurationTarget.Global);
      await this._configService.updateConfig("app", {
        llm: {
          temperature: llmSettings.temperature,
          maxTokens: llmSettings.maxTokens
        }
      });
      this._vscodeService.showInformationMessage("LLM \uC124\uC815\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4");
    } catch (error) {
      console.error("LLM \uC124\uC815 \uC800\uC7A5 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this._vscodeService.showErrorMessage(`LLM \uC124\uC815 \uC800\uC7A5 \uC2E4\uD328: ${error.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`);
    }
  }
  /**
   * Handles saving LLM models
   * 
   * @param models The models to save
   */
  async _handleSaveModels(models) {
    try {
      await this._vsCodeConfig.update("llm.models", models, vscode8.ConfigurationTarget.Global);
      this._vscodeService.showInformationMessage("\uBAA8\uB378 \uC124\uC815\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4");
      await this._sendCurrentSettings();
    } catch (error) {
      console.error("\uBAA8\uB378 \uC124\uC815 \uC800\uC7A5 \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
      this._vscodeService.showErrorMessage(`\uBAA8\uB378 \uC124\uC815 \uC800\uC7A5 \uC2E4\uD328: ${error.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958"}`);
    }
  }
  /**
   * Handles adding a new plugin
   * 
   * @param pluginInfo The plugin information
   */
  async _handleAddPlugin(pluginInfo) {
    const config = this._configService.getAppConfig();
    const currentPlugins = config.plugins || [];
    currentPlugins.push({
      id: pluginInfo.id,
      name: pluginInfo.name,
      type: pluginInfo.type,
      enabled: true,
      settings: pluginInfo.settings || {}
    });
    await this._configService.updateConfig("app", {
      plugins: currentPlugins
    });
    await this._sendCurrentSettings();
    this._vscodeService.showInformationMessage(`Plugin ${pluginInfo.name} added`);
  }
  /**
   * Handles removing a plugin
   * 
   * @param pluginId The ID of the plugin to remove
   */
  async _handleRemovePlugin(pluginId) {
    const config = this._configService.getAppConfig();
    let currentPlugins = config.plugins || [];
    currentPlugins = currentPlugins.filter((plugin) => plugin.id !== pluginId);
    await this._configService.updateConfig("app", {
      plugins: currentPlugins
    });
    await this._sendCurrentSettings();
    this._vscodeService.showInformationMessage(`Plugin removed`);
  }
  /**
   * Gets the HTML for the webview
   * 
   * @param webview The webview
   * @returns The HTML string
   */
  _getHtmlForWebview(webview) {
    const cssUri = webview.asWebviewUri(
      vscode8.Uri.joinPath(this._extensionUri, "resources", "css", "ape-ui.css")
    );
    let cssContent = "";
    try {
      const cssPath = import_path.default.join(this._extensionUri.fsPath, "resources", "css", "ape-ui.css");
      cssContent = import_fs.default.readFileSync(cssPath, "utf8");
    } catch (error) {
      console.error("Error reading CSS file:", error);
    }
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>APE Settings</title>
        <link href="${cssUri}" rel="stylesheet">
        <style>
            body {
                padding: 0;
                color: var(--vscode-foreground);
                font-size: var(--vscode-font-size);
                font-weight: var(--vscode-font-weight);
                font-family: var(--vscode-font-family);
                background-color: var(--vscode-editor-background);
            }
            
            .settings-container {
                padding: 10px;
            }
            
            .tab-container {
                display: flex;
                border-bottom: 1px solid var(--vscode-panel-border);
                margin-bottom: 15px;
            }
            
            .tab {
                padding: 8px 12px;
                cursor: pointer;
                border: none;
                background: none;
                color: var(--vscode-foreground);
                opacity: 0.7;
                font-size: 13px;
            }
            
            .tab.active {
                opacity: 1;
                border-bottom: 2px solid var(--vscode-button-background);
                font-weight: bold;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            input[type="text"],
            input[type="email"],
            input[type="password"],
            input[type="number"],
            select,
            textarea {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 2px;
            }
            
            input:focus,
            select:focus,
            textarea:focus {
                outline: 1px solid var(--vscode-focusBorder);
            }
            
            button {
                padding: 6px 12px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 2px;
                cursor: pointer;
                margin-right: 5px;
            }
            
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .button-container {
                display: flex;
                justify-content: flex-end;
                margin-top: 15px;
            }
            
            .section-title {
                font-size: 14px;
                font-weight: 600;
                margin: 15px 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .plugin-list {
                margin-top: 10px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .plugin-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .plugin-item:last-child {
                border-bottom: none;
            }
            
            .plugin-info {
                display: flex;
                flex-direction: column;
            }
            
            .plugin-name {
                font-weight: 500;
            }
            
            .plugin-type {
                font-size: 12px;
                opacity: 0.8;
            }
            
            .plugin-actions {
                display: flex;
            }
            
            .plugin-toggle {
                margin-right: 8px;
                cursor: pointer;
            }
            
            .remove-plugin {
                color: var(--vscode-errorForeground);
                cursor: pointer;
                background: none;
                border: none;
                padding: 2px 4px;
                font-size: 12px;
            }
            
            .add-plugin-form {
                margin-top: 10px;
                padding: 10px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
                background-color: var(--vscode-editor-background);
            }
            
            .two-column {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .endpoint-group {
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
            }
            
            .endpoint-title {
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .api-key-input {
                position: relative;
            }
            
            .toggle-visibility {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: var(--vscode-foreground);
                opacity: 0.7;
                cursor: pointer;
            }
            
            .model-selection {
                margin-top: 15px;
            }
            
            
            .slider-container {
                margin-top: 5px;
            }
            
            .slider {
                -webkit-appearance: none;
                width: 100%;
                height: 4px;
                background: var(--vscode-scrollbarSlider-background);
                outline: none;
                border-radius: 2px;
            }
            
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--vscode-button-background);
                cursor: pointer;
            }
            
            .slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--vscode-button-background);
                cursor: pointer;
            }
            
            .slider-value {
                display: inline-block;
                margin-left: 10px;
                font-size: 12px;
            }

            .info-text {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 4px;
            }

            
            .models-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 16px;
                margin-top: 16px;
            }
            
            .model-item {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
                padding: 16px;
                position: relative;
                background: var(--vscode-editor-background);
                transition: box-shadow 0.2s, transform 0.2s;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .model-item:hover {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }

            .model-item-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }

            .model-name {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 4px;
            }

            .model-provider {
                font-size: 12px;
                opacity: 0.8;
                font-style: italic;
                margin-bottom: 4px;
                padding: 2px 6px;
                border-radius: 4px;
                display: inline-block;
            }
            
            .model-provider.internal {
                background-color: var(--vscode-activityBarBadge-background);
                color: var(--vscode-activityBarBadge-foreground);
            }
            
            .model-provider.external {
                background-color: var(--vscode-statusBarItem-warningBackground);
                color: var(--vscode-statusBarItem-warningForeground);
            }

            .model-details {
                font-size: 12px;
                margin-top: 8px;
                flex-grow: 1;
            }

            .model-details div {
                margin-bottom: 6px;
                line-height: 1.4;
            }
            
            .model-detail-label {
                font-weight: 500;
                margin-right: 4px;
                display: inline-block;
                min-width: 100px;
            }

            .model-actions {
                display: flex;
                gap: 8px;
                margin-top: 16px;
                justify-content: flex-end;
            }

            .model-default-badge {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                position: absolute;
                top: 12px;
                right: 12px;
            }

            .model-edit-form {
                border: 1px solid var(--vscode-button-background);
                border-radius: 4px;
                padding: 15px;
                margin-top: 15px;
                margin-bottom: 15px;
                background-color: var(--vscode-sideBar-background);
            }

            .add-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-top: 10px;
            }

            .edit-button, .delete-button, .set-default-button {
                padding: 6px 10px;
                cursor: pointer;
                font-size: 12px;
                border-radius: 4px;
                border: 1px solid var(--vscode-button-background);
            }

            .edit-button {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            .delete-button {
                background-color: var(--vscode-errorForeground);
                color: white;
            }
            
            .set-default-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
        </style>
    </head>
    <body>
        <div class="settings-container">
            <div class="tab-container">
                <button class="tab active" data-tab="user-info">User Info</button>
                <button class="tab" data-tab="plugin-settings">Plugin Settings</button>
                <button class="tab" data-tab="api-endpoints">API Endpoints</button>
                <button class="tab" data-tab="llm-settings">LLM Settings</button>
            </div>
            
            <!-- User Information Tab -->
            <div class="tab-content active" id="user-info">
                <div class="section-title">Basic Information</div>
                <div class="form-group">
                    <label for="displayName">Display Name</label>
                    <input type="text" id="displayName" placeholder="Your display name">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="Your email address">
                </div>
                
                <div class="section-title">Git Information</div>
                <div class="form-group">
                    <label for="gitUsername">Git Username</label>
                    <input type="text" id="gitUsername" placeholder="Your Git username">
                </div>
                <div class="form-group">
                    <label for="gitEmail">Git Email</label>
                    <input type="email" id="gitEmail" placeholder="Your Git email">
                </div>
                
                <div class="section-title">SWDP Information</div>
                <div class="form-group">
                    <label for="swdpUsername">SWDP Username</label>
                    <input type="text" id="swdpUsername" placeholder="Your SWDP username">
                </div>
                <div class="form-group">
                    <label for="swdpTeam">SWDP Team</label>
                    <input type="text" id="swdpTeam" placeholder="Your SWDP team">
                </div>
                
                <div class="button-container">
                    <button id="saveUserInfo">Save</button>
                </div>
            </div>
            
            <!-- Plugin Settings Tab -->
            <div class="tab-content" id="plugin-settings">
                <div class="section-title">Installed Plugins</div>
                <div class="plugin-list" id="pluginList">
                    <!-- Dynamically populated -->
                </div>
                
                <div class="section-title">Add New Plugin</div>
                <div class="add-plugin-form">
                    <div class="form-group">
                        <label for="pluginId">Plugin ID</label>
                        <input type="text" id="pluginId" placeholder="Unique plugin identifier">
                    </div>
                    <div class="form-group">
                        <label for="pluginName">Plugin Name</label>
                        <input type="text" id="pluginName" placeholder="Human-readable name">
                    </div>
                    <div class="form-group">
                        <label for="pluginType">Type</label>
                        <select id="pluginType">
                            <option value="internal">Internal</option>
                            <option value="external">External</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pluginSettings">Plugin Settings (JSON)</label>
                        <textarea id="pluginSettings" rows="4" placeholder='{"key": "value"}'></textarea>
                    </div>
                    <div class="button-container">
                        <button id="addPlugin">Add Plugin</button>
                    </div>
                </div>
                
                <div class="button-container">
                    <button id="savePluginSettings">Save All</button>
                </div>
            </div>
            
            <!-- API Endpoints Tab -->
            <div class="tab-content" id="api-endpoints">
                <div class="section-title">API Endpoint Configuration</div>
                <p class="info-text">Configure API endpoints for various services used by APE. These settings will override the default endpoints.</p>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">LLM Endpoint</div>
                    <div class="form-group">
                        <label for="llmEndpoint">URL</label>
                        <input type="text" id="llmEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">Git API Endpoint</div>
                    <div class="form-group">
                        <label for="gitApiEndpoint">URL</label>
                        <input type="text" id="gitApiEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">Jira API Endpoint</div>
                    <div class="form-group">
                        <label for="jiraApiEndpoint">URL</label>
                        <input type="text" id="jiraApiEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">SWDP API Endpoint</div>
                    <div class="form-group">
                        <label for="swdpApiEndpoint">URL</label>
                        <input type="text" id="swdpApiEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">Pocket API Endpoint</div>
                    <div class="form-group">
                        <label for="pocketApiEndpoint">URL</label>
                        <input type="text" id="pocketApiEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="button-container">
                    <button id="saveApiEndpoints">Save Endpoints</button>
                </div>
            </div>
            
            <!-- LLM Settings Tab -->
            <div class="tab-content" id="llm-settings">
                <div class="section-title">\uBAA8\uB378 \uAE30\uBCF8 \uC124\uC815</div>
                <div class="form-group">
                    <label for="defaultModel">\uAE30\uBCF8 \uBAA8\uB378 \uC120\uD0DD</label>
                    <select id="defaultModel">
                        <!-- \uB3D9\uC801\uC73C\uB85C \uC0DD\uC131\uB428 -->
                    </select>
                    <p class="info-text">\uCC44\uD305\uCC3D\uC5D0\uC11C \uC0AC\uC6A9\uD560 \uAE30\uBCF8 \uBAA8\uB378\uC744 \uC120\uD0DD\uD569\uB2C8\uB2E4</p>
                </div>
                
                <div class="form-group">
                    <label for="supportsStreaming">\uC2A4\uD2B8\uB9AC\uBC0D \uC9C0\uC6D0</label>
                    <input type="checkbox" id="supportsStreaming"> 
                    <span class="info-text">\uC2A4\uD2B8\uB9AC\uBC0D \uC751\uB2F5\uC744 \uC9C0\uC6D0\uD569\uB2C8\uB2E4.</span>
                </div>
                
                <div class="section-title">\uBAA8\uB378 \uAD00\uB9AC</div>
                <div class="form-group">
                    <p class="info-text">\uB0B4\uBD80\uB9DD \uBC0F \uC678\uBD80\uB9DD LLM \uBAA8\uB378\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4. \uC5EC\uAE30\uC11C \uCD94\uAC00\uD55C \uBAA8\uB378\uC740 \uCC44\uD305\uCC3D\uC758 \uBAA8\uB378 \uC120\uD0DD\uAE30\uC5D0\uC11C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
                </div>
                
                <div class="form-group">
                    <button id="addModelBtn" class="add-button">\uC0C8 \uBAA8\uB378 \uCD94\uAC00</button>
                </div>
                
                <div class="models-grid" id="models-container">
                    <!-- \uB3D9\uC801\uC73C\uB85C \uC0DD\uC131\uB428 -->
                </div>
                
                <div id="modelEditForm" style="display: none;" class="model-edit-form">
                    <div class="section-title">\uBAA8\uB378 \uC124\uC815 \uD3B8\uC9D1</div>
                    <div class="form-group">
                        <label for="modelId">\uBAA8\uB378 ID</label>
                        <input type="text" id="modelId" placeholder="\uBAA8\uB378 \uC2DD\uBCC4\uC790">
                    </div>
                    <div class="form-group">
                        <label for="modelName">\uBAA8\uB378 \uC774\uB984</label>
                        <input type="text" id="modelName" placeholder="\uD45C\uC2DC \uC774\uB984">
                    </div>
                    <div class="form-group">
                        <label for="modelProvider">\uC81C\uACF5\uC790</label>
                        <select id="modelProvider">
                            <option value="custom">\uB0B4\uBD80\uB9DD (Custom)</option>
                            <option value="openrouter">OpenRouter (\uC678\uBD80 \uD14C\uC2A4\uD2B8\uC6A9)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="modelApiUrl">API URL</label>
                        <input type="text" id="modelApiUrl" placeholder="https:
                    </div>
                    <div class="form-group">
                        <label for="modelApiModel">API \uBAA8\uB378 \uBA85\uCE6D</label>
                        <input type="text" id="modelApiModel" placeholder="\uBAA8\uB378 \uC9C0\uC815\uC790 (\uC120\uD0DD\uC0AC\uD56D)">
                        <p class="info-text">\uC77C\uBD80 API\uC5D0\uC11C\uB9CC \uD544\uC694\uD569\uB2C8\uB2E4</p>
                    </div>
                    <div class="form-group">
                        <label for="modelContextWindow">\uCF58\uD14D\uC2A4\uD2B8 \uC708\uB3C4\uC6B0</label>
                        <input type="number" id="modelContextWindow" placeholder="32000">
                    </div>
                    <div class="form-group">
                        <label for="modelMaxTokens">\uCD5C\uB300 \uD1A0\uD070</label>
                        <input type="number" id="modelMaxTokens" placeholder="8192">
                    </div>
                    <div class="form-group">
                        <label for="modelSystemPrompt">\uC2DC\uC2A4\uD15C \uD504\uB86C\uD504\uD2B8</label>
                        <textarea id="modelSystemPrompt" rows="3" placeholder="\uAE30\uBCF8 \uC2DC\uC2A4\uD15C \uD504\uB86C\uD504\uD2B8"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="modelHeadersJson">HTTP \uD5E4\uB354 (JSON)</label>
                        <textarea id="modelHeadersJson" rows="3" placeholder='{"x-api-key": "API_KEY"}'></textarea>
                        <p class="info-text">\uB0B4\uBD80\uB9DD API\uC5D0 \uD544\uC694\uD55C \uCD94\uAC00 \uD5E4\uB354\uB97C JSON \uD615\uC2DD\uC73C\uB85C \uC785\uB825\uD558\uC138\uC694</p>
                    </div>
                    <div class="button-container">
                        <button id="saveModelBtn">\uC800\uC7A5</button>
                        <button id="cancelModelBtn">\uCDE8\uC18C</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="temperature">Temperature</label>
                    <div class="slider-container">
                        <input type="range" min="0" max="1" step="0.01" value="0.7" class="slider" id="temperature">
                        <span class="slider-value" id="temperatureValue">0.7</span>
                    </div>
                    <p class="info-text">Lower values make responses more deterministic, higher values more creative.</p>
                </div>
                
                <div class="form-group">
                    <label for="maxTokens">Max Tokens</label>
                    <div class="two-column">
                        <input type="number" id="maxTokens" min="100" max="100000" step="100" value="4000">
                    </div>
                    <p class="info-text">Maximum number of tokens to generate in the response.</p>
                </div>
                
                <div class="button-container">
                    <button id="saveLlmSettings">Save Settings</button>
                </div>
            </div>
        </div>
        
        <script>
            (function() {
                
                const tabs = document.querySelectorAll('.tab');
                const tabContents = document.querySelectorAll('.tab-content');
                
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const tabId = tab.getAttribute('data-tab');
                        
                        
                        tabs.forEach(t => t.classList.remove('active'));
                        tabContents.forEach(c => c.classList.remove('active'));
                        
                        
                        tab.classList.add('active');
                        document.getElementById(tabId).classList.add('active');
                    });
                });
                
                
                const temperatureSlider = document.getElementById('temperature');
                const temperatureValue = document.getElementById('temperatureValue');
                
                temperatureSlider.addEventListener('input', () => {
                    temperatureValue.textContent = temperatureSlider.value;
                });
                
                
                const toggleButtons = document.querySelectorAll('.toggle-visibility');
                
                toggleButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const targetId = button.getAttribute('data-target');
                        const inputField = document.getElementById(targetId);
                        
                        if (inputField.type === 'password') {
                            inputField.type = 'text';
                            button.textContent = 'Hide';
                        } else {
                            inputField.type = 'password';
                            button.textContent = 'Show';
                        }
                    });
                });
                
                
                function renderPluginList(plugins = []) {
                    const pluginList = document.getElementById('pluginList');
                    pluginList.innerHTML = '';
                    
                    if (plugins.length === 0) {
                        pluginList.innerHTML = '<div class="plugin-item">No plugins installed</div>';
                        return;
                    }
                    
                    plugins.forEach(plugin => {
                        const pluginItem = document.createElement('div');
                        pluginItem.className = 'plugin-item';
                        pluginItem.innerHTML = \`
                            <div class="plugin-info">
                                <span class="plugin-name">\${plugin.name}</span>
                                <span class="plugin-type">\${plugin.type} plugin</span>
                            </div>
                            <div class="plugin-actions">
                                <input type="checkbox" class="plugin-toggle" data-id="\${plugin.id}" \${plugin.enabled ? 'checked' : ''}>
                                <button class="remove-plugin" data-id="\${plugin.id}">Remove</button>
                            </div>
                        \`;
                        
                        pluginList.appendChild(pluginItem);
                    });
                    
                    
                    document.querySelectorAll('.plugin-toggle').forEach(toggle => {
                        toggle.addEventListener('change', (e) => {
                            const pluginId = e.target.getAttribute('data-id');
                            const pluginIndex = plugins.findIndex(p => p.id === pluginId);
                            
                            if (pluginIndex !== -1) {
                                plugins[pluginIndex].enabled = e.target.checked;
                            }
                        });
                    });
                    
                    document.querySelectorAll('.remove-plugin').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const pluginId = e.target.getAttribute('data-id');
                            
                            vscode.postMessage({
                                command: 'removePlugin',
                                pluginId: pluginId
                            });
                        });
                    });
                }
                
                
                document.getElementById('addPlugin').addEventListener('click', () => {
                    const id = document.getElementById('pluginId').value.trim();
                    const name = document.getElementById('pluginName').value.trim();
                    const type = document.getElementById('pluginType').value;
                    let settings = {};
                    
                    try {
                        const settingsText = document.getElementById('pluginSettings').value.trim();
                        if (settingsText) {
                            settings = JSON.parse(settingsText);
                        }
                    } catch (e) {
                        vscode.postMessage({
                            command: 'showError',
                            message: 'Invalid JSON in plugin settings'
                        });
                        return;
                    }
                    
                    if (!id || !name) {
                        vscode.postMessage({
                            command: 'showError',
                            message: 'Plugin ID and name are required'
                        });
                        return;
                    }
                    
                    vscode.postMessage({
                        command: 'addPlugin',
                        pluginInfo: {
                            id,
                            name,
                            type,
                            settings
                        }
                    });
                    
                    
                    document.getElementById('pluginId').value = '';
                    document.getElementById('pluginName').value = '';
                    document.getElementById('pluginSettings').value = '';
                });
                
                
                document.getElementById('saveUserInfo').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'saveUserInfo',
                        userInfo: {
                            displayName: document.getElementById('displayName').value,
                            email: document.getElementById('email').value,
                            gitUsername: document.getElementById('gitUsername').value,
                            gitEmail: document.getElementById('gitEmail').value,
                            swdpUsername: document.getElementById('swdpUsername').value,
                            swdpTeam: document.getElementById('swdpTeam').value
                        }
                    });
                });
                
                
                document.getElementById('savePluginSettings').addEventListener('click', () => {
                    
                    const plugins = [];
                    document.querySelectorAll('.plugin-item').forEach(item => {
                        const nameElement = item.querySelector('.plugin-name');
                        const typeElement = item.querySelector('.plugin-type');
                        const toggleElement = item.querySelector('.plugin-toggle');
                        
                        if (nameElement && typeElement && toggleElement) {
                            plugins.push({
                                id: toggleElement.getAttribute('data-id'),
                                name: nameElement.textContent,
                                type: typeElement.textContent.replace(' plugin', ''),
                                enabled: toggleElement.checked
                            });
                        }
                    });
                    
                    vscode.postMessage({
                        command: 'savePluginSettings',
                        pluginSettings: plugins
                    });
                });
                
                
                document.getElementById('saveApiEndpoints').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'saveApiEndpoints',
                        apiEndpoints: {
                            llmEndpoint: document.getElementById('llmEndpoint').value,
                            gitApiEndpoint: document.getElementById('gitApiEndpoint').value,
                            jiraApiEndpoint: document.getElementById('jiraApiEndpoint').value,
                            swdpApiEndpoint: document.getElementById('swdpApiEndpoint').value,
                            pocketApiEndpoint: document.getElementById('pocketApiEndpoint').value
                        }
                    });
                });
                
                
                document.getElementById('saveLlmSettings').addEventListener('click', () => {
                    
                    const openRouterKeyElement = document.getElementById('openRouterApiKey');
                    const openRouterKey = openRouterKeyElement ? openRouterKeyElement.value : '';

                    vscode.postMessage({
                        command: 'saveLlmSettings',
                        llmSettings: {
                            defaultModel: document.getElementById('defaultModel').value,
                            
                            openRouterApiKey: openRouterKey,
                            supportsStreaming: document.getElementById('supportsStreaming').checked,
                            temperature: parseFloat(document.getElementById('temperature').value),
                            maxTokens: parseInt(document.getElementById('maxTokens').value)
                        }
                    });
                });
                
                
                
                let currentModels = {};
                let editingModelId = null;
                
                
                function renderModelsList(models) {
                    const modelsContainer = document.getElementById('models-container');
                    modelsContainer.innerHTML = '';
                    currentModels = models || {};
                    
                    
                    const defaultModelId = document.getElementById('defaultModel').value;
                    
                    if (Object.keys(models).length === 0) {
                        modelsContainer.innerHTML = '<div class="info-text" style="grid-column: 1/-1; padding: 20px; text-align: center;">\uB4F1\uB85D\uB41C \uBAA8\uB378\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. "\uC0C8 \uBAA8\uB378 \uCD94\uAC00" \uBC84\uD2BC\uC744 \uD074\uB9AD\uD558\uC5EC \uBAA8\uB378\uC744 \uCD94\uAC00\uD558\uC138\uC694.</div>';
                        return;
                    }
                    
                    for (const [modelId, model] of Object.entries(models)) {
                        const modelItem = document.createElement('div');
                        modelItem.className = 'model-item';
                        modelItem.dataset.id = modelId;
                        
                        const provider = model.provider || 'custom';
                        const isInternal = provider === 'custom';
                        const providerLabel = isInternal ? '\uB0B4\uBD80\uB9DD' : 'OpenRouter';
                        const providerClass = isInternal ? 'internal' : 'external';
                        
                        const modelName = model.name || modelId;
                        const modelApiUrl = model.apiUrl || '\uC9C0\uC815\uB418\uC9C0 \uC54A\uC74C';
                        const contextWindow = model.contextWindow || 'N/A';
                        const maxTokens = model.maxTokens || 'N/A';
                        
                        
                        let systemPromptDisplay = 'N/A';
                        if (model.systemPrompt) {
                            const promptText = model.systemPrompt;
                            systemPromptDisplay = promptText.length > 50 ? 
                                promptText.substring(0, 50) + '...' : promptText;
                        }
                        
                        
                        let headersDisplay = '';
                        if (model.headers) {
                            const headersText = JSON.stringify(model.headers);
                            const truncated = headersText.length > 30 ? 
                                headersText.substring(0, 30) + '...' : headersText;
                            headersDisplay = '<div><span class="model-detail-label">\uD5E4\uB354:</span> ' + truncated + '</div>';
                        }
                        
                        
                        let apiModelDisplay = '';
                        if (model.apiModel) {
                            apiModelDisplay = '<div><span class="model-detail-label">API \uBAA8\uB378:</span> ' + model.apiModel + '</div>';
                        }
                        
                        
                        const isDefault = modelId === defaultModelId;
                        const defaultBadge = isDefault ? 
                            '<div class="model-default-badge">\uAE30\uBCF8 \uBAA8\uB378</div>' : '';
                        
                        modelItem.innerHTML = 
                            defaultBadge +
                            '<div class="model-item-header">' +
                            '  <div>' +
                            '    <div class="model-name">' + modelName + '</div>' +
                            '    <div class="model-provider ' + providerClass + '">' + providerLabel + '</div>' +
                            '    <div style="font-size: 11px; opacity: 0.7;">ID: ' + modelId + '</div>' +
                            '  </div>' +
                            '</div>' +
                            '<div class="model-details">' +
                            '  <div><span class="model-detail-label">API URL:</span> ' + modelApiUrl + '</div>' +
                            apiModelDisplay +
                            '  <div><span class="model-detail-label">\uCF58\uD14D\uC2A4\uD2B8 \uC708\uB3C4\uC6B0:</span> ' + contextWindow + '</div>' +
                            '  <div><span class="model-detail-label">\uCD5C\uB300 \uD1A0\uD070:</span> ' + maxTokens + '</div>' +
                            '  <div><span class="model-detail-label">\uC2DC\uC2A4\uD15C \uD504\uB86C\uD504\uD2B8:</span> ' + systemPromptDisplay + '</div>' +
                            headersDisplay +
                            '</div>' +
                            '<div class="model-actions">' +
                            '  <button class="edit-button" data-id="' + modelId + '">\uD3B8\uC9D1</button>' +
                            '  <button class="delete-button" data-id="' + modelId + '">\uC0AD\uC81C</button>' +
                            '  ' + (isDefault ? '' : '<button class="set-default-button" data-id="' + modelId + '">\uAE30\uBCF8 \uBAA8\uB378\uB85C \uC124\uC815</button>') +
                            '</div>';
                        
                        modelsContainer.appendChild(modelItem);
                    }
                    
                    
                    document.querySelectorAll('.edit-button').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const modelId = e.target.getAttribute('data-id');
                            openModelEditForm(modelId, currentModels[modelId]);
                        });
                    });
                    
                    
                    document.querySelectorAll('.delete-button').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const modelId = e.target.getAttribute('data-id');
                            const modelName = currentModels[modelId] ? (currentModels[modelId].name || modelId) : modelId;
                            if (confirm('\uC815\uB9D0\uB85C "' + modelName + '" \uBAA8\uB378\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) {
                                deleteModel(modelId);
                            }
                        });
                    });
                    
                    
                    document.querySelectorAll('.set-default-button').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const modelId = e.target.getAttribute('data-id');
                            document.getElementById('defaultModel').value = modelId;
                            
                            
                            vscode.postMessage({
                                command: 'saveLlmSettings',
                                llmSettings: {
                                    defaultModel: modelId,
                                    openRouterApiKey: document.getElementById('openRouterApiKey').value,
                                    supportsStreaming: document.getElementById('supportsStreaming').checked,
                                    temperature: parseFloat(document.getElementById('temperature').value),
                                    maxTokens: parseInt(document.getElementById('maxTokens').value)
                                }
                            });
                            
                            
                            renderModelsList(currentModels);
                        });
                    });
                }
                
                
                function openModelEditForm(modelId, model) {
                    const form = document.getElementById('modelEditForm');
                    editingModelId = modelId;
                    
                    
                    document.getElementById('modelId').value = modelId || '';
                    document.getElementById('modelId').disabled = !!modelId;  
                    document.getElementById('modelName').value = model?.name || '';
                    document.getElementById('modelProvider').value = model?.provider || 'custom';
                    document.getElementById('modelApiUrl').value = model?.apiUrl || '';
                    document.getElementById('modelApiModel').value = model?.apiModel || '';
                    document.getElementById('modelContextWindow').value = model?.contextWindow || 32000;
                    document.getElementById('modelMaxTokens').value = model?.maxTokens || 8192;
                    document.getElementById('modelSystemPrompt').value = model?.systemPrompt || '';
                    document.getElementById('modelHeadersJson').value = model?.headers ? JSON.stringify(model.headers, null, 2) : '';
                    
                    
                    form.style.display = 'block';
                    document.getElementById('modelId').focus();
                }
                
                
                function saveModel() {
                    try {
                        const modelId = document.getElementById('modelId').value.trim();
                        
                        if (!modelId) {
                            alert('\uBAA8\uB378 ID\uB294 \uD544\uC218\uC785\uB2C8\uB2E4.');
                            return;
                        }
                        
                        
                        const model = {
                            name: document.getElementById('modelName').value.trim() || modelId,
                            provider: document.getElementById('modelProvider').value,
                            apiUrl: document.getElementById('modelApiUrl').value.trim(),
                            contextWindow: parseInt(document.getElementById('modelContextWindow').value) || 32000,
                            maxTokens: parseInt(document.getElementById('modelMaxTokens').value) || 8192,
                            systemPrompt: document.getElementById('modelSystemPrompt').value.trim()
                        };
                        
                        
                        const apiModel = document.getElementById('modelApiModel').value.trim();
                        if (apiModel) {
                            model.apiModel = apiModel;
                        }
                        
                        
                        const headersJson = document.getElementById('modelHeadersJson').value.trim();
                        if (headersJson) {
                            try {
                                model.headers = JSON.parse(headersJson);
                            } catch (e) {
                                alert('HTTP \uD5E4\uB354 JSON \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.');
                                return;
                            }
                        }
                        
                        
                        const updatedModels = { ...currentModels };
                        
                        
                        if (editingModelId && editingModelId !== modelId) {
                            
                            delete updatedModels[editingModelId];
                            updatedModels[modelId] = model;
                        } else {
                            
                            updatedModels[modelId] = model;
                        }
                        
                        
                        vscode.postMessage({
                            command: 'saveModels',
                            models: updatedModels
                        });
                        
                        
                        closeModelEditForm();
                    } catch (error) {
                        alert('\uBAA8\uB378 \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ' + error.message);
                    }
                }
                
                
                function deleteModel(modelId) {
                    if (!modelId || !currentModels[modelId]) return;
                    
                    
                    const updatedModels = { ...currentModels };
                    delete updatedModels[modelId];
                    
                    
                    vscode.postMessage({
                        command: 'saveModels',
                        models: updatedModels
                    });
                }
                
                
                function closeModelEditForm() {
                    document.getElementById('modelEditForm').style.display = 'none';
                    editingModelId = null;
                }
                
                
                document.getElementById('addModelBtn').addEventListener('click', () => {
                    openModelEditForm(null, null);
                });
                
                
                document.getElementById('saveModelBtn').addEventListener('click', saveModel);
                
                
                document.getElementById('cancelModelBtn').addEventListener('click', closeModelEditForm);
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'updateSettings':
                            
                            const userInfo = message.settings.userInfo;
                            document.getElementById('displayName').value = userInfo.displayName || '';
                            document.getElementById('email').value = userInfo.email || '';
                            document.getElementById('gitUsername').value = userInfo.gitUsername || '';
                            document.getElementById('gitEmail').value = userInfo.gitEmail || '';
                            document.getElementById('swdpUsername').value = userInfo.swdpUsername || '';
                            document.getElementById('swdpTeam').value = userInfo.swdpTeam || '';
                            
                            
                            renderPluginList(message.settings.pluginSettings);
                            
                            
                            const apiEndpoints = message.settings.apiEndpoints;
                            document.getElementById('llmEndpoint').value = apiEndpoints.llmEndpoint || '';
                            document.getElementById('gitApiEndpoint').value = apiEndpoints.gitApiEndpoint || '';
                            document.getElementById('jiraApiEndpoint').value = apiEndpoints.jiraApiEndpoint || '';
                            document.getElementById('swdpApiEndpoint').value = apiEndpoints.swdpApiEndpoint || '';
                            document.getElementById('pocketApiEndpoint').value = apiEndpoints.pocketApiEndpoint || '';
                            
                            
                            const llmSettings = message.settings.llmSettings;
                            const availableModels = message.settings.availableModels || {};
                            
                            
                            const defaultModelSelect = document.getElementById('defaultModel');
                            defaultModelSelect.innerHTML = ''; 
                            
                            console.log('\uC6F9\uBDF0\uC5D0\uC11C \uBAA8\uB378 \uBAA9\uB85D:', availableModels);
                            
                            
                            if (availableModels && Object.keys(availableModels).length > 0) {
                                Object.keys(availableModels).forEach(modelId => {
                                    const model = availableModels[modelId];
                                    const option = document.createElement('option');
                                    option.value = modelId;
                                    option.textContent = model.name || modelId;
                                    defaultModelSelect.appendChild(option);
                                });
                            } else {
                                
                                const option = document.createElement('option');
                                option.value = '';
                                option.textContent = '\uC124\uC815\uB41C \uBAA8\uB378 \uC5C6\uC74C';
                                defaultModelSelect.appendChild(option);
                                console.warn('\uBAA8\uB378 \uBAA9\uB85D\uC774 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4');
                            }
                            
                            
                            defaultModelSelect.value = llmSettings.defaultModel || '';
                            
                            
                            renderModelsList(availableModels);
                            
                            
                            
                            if (document.getElementById('openRouterApiKey')) {
                              document.getElementById('openRouterApiKey').value = llmSettings.openRouterApiKey || '';
                            }
                            
                            
                            document.getElementById('supportsStreaming').checked = llmSettings.supportsStreaming || false;
                            
                            
                            const temperature = llmSettings.temperature || 0.7;
                            document.getElementById('temperature').value = temperature;
                            document.getElementById('temperatureValue').textContent = temperature;
                            
                            
                            document.getElementById('maxTokens').value = llmSettings.maxTokens || 4000;
                            break;
                    }
                });
                
                
                vscode.postMessage({
                    command: 'getSettings'
                });
                
                
                const vscode = acquireVsCodeApi();
            })();
        </script>
    </body>
    </html>`;
  }
};
ApeSettingsViewProvider.viewType = "ape.settingsView";

// src/extension.ts
var coreService;
var chatService;
var chatViewProvider;
var treeDataProvider;
var fileExplorerProvider;
var settingsViewProvider;
async function activate(context) {
  try {
    console.log("APE \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \uD65C\uC131\uD654 \uC2DC\uC791");
    console.log("ape:showChatView \uCEE8\uD14D\uC2A4\uD2B8 \uC124\uC815 - true");
    await vscode9.commands.executeCommand("setContext", "ape:showChatView", true);
    await loadEnvironment();
    coreService = new CoreService(context);
    await coreService.initialize();
    chatService = new ChatService(coreService, context);
    chatViewProvider = new ApeChatViewProvider(
      context.extensionUri,
      chatService,
      coreService
    );
    treeDataProvider = new ApeTreeDataProvider(coreService, chatService);
    fileExplorerProvider = new ApeFileExplorerProvider(context.extensionUri);
    settingsViewProvider = new ApeSettingsViewProvider(
      context.extensionUri,
      coreService
    );
    context.subscriptions.push(
      vscode9.window.registerWebviewViewProvider(
        "ape.chatView",
        // package.json에 정의된 ID와 일치
        chatViewProvider,
        {
          webviewOptions: {
            retainContextWhenHidden: true
          }
        }
      )
    );
    console.log("\uD2B8\uB9AC\uBDF0 \uB4F1\uB85D \uC2DC\uC791: ape.treeView");
    const treeView = vscode9.window.createTreeView("ape.treeView", {
      // package.json에 정의된 ID와 일치
      treeDataProvider,
      showCollapseAll: true
    });
    console.log("\uD2B8\uB9AC\uBDF0 \uB4F1\uB85D \uC644\uB8CC: ape.treeView");
    treeView.onDidChangeVisibility((e) => {
      console.log(`\uD2B8\uB9AC\uBDF0 \uAC00\uC2DC\uC131 \uBCC0\uACBD: \uBCF4\uC784=${e.visible}`);
    });
    context.subscriptions.push(treeView);
    context.subscriptions.push(
      vscode9.window.registerWebviewViewProvider(
        "ape.settingsView",
        // package.json에 정의된 ID와 일치
        settingsViewProvider
      )
    );
    context.subscriptions.push(
      vscode9.window.registerWebviewViewProvider(
        "ape.fileExplorerView",
        // package.json에 정의된 ID와 일치
        fileExplorerProvider
      )
    );
    registerCommands(context);
    console.log("APE \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \uD65C\uC131\uD654 \uC644\uB8CC");
  } catch (error) {
    console.error("APE \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \uD65C\uC131\uD654 \uC624\uB958:", error);
    vscode9.window.showErrorMessage(
      `APE \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8\uC744 \uD65C\uC131\uD654\uD558\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
function deactivate() {
  try {
    console.log("APE \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \uBE44\uD65C\uC131\uD654 \uC2DC\uC791");
    if (coreService) {
      coreService.dispose();
    }
    console.log("APE \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \uBE44\uD65C\uC131\uD654 \uC644\uB8CC");
  } catch (error) {
    console.error("APE \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \uBE44\uD65C\uC131\uD654 \uC624\uB958:", error);
  }
}
async function loadEnvironment() {
  try {
    try {
      const envLoader = require("../config/env.loader.js");
      if (envLoader && typeof envLoader.loadEnvironment === "function") {
        await envLoader.loadEnvironment();
        console.log("\uD658\uACBD\uC124\uC815 \uB85C\uB4DC \uC644\uB8CC");
      } else {
        console.warn("\uD658\uACBD\uC124\uC815 \uB85C\uB354 \uD568\uC218\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
      }
    } catch (error) {
      console.warn("\uD658\uACBD\uC124\uC815 \uB85C\uB4DC \uC2E4\uD328:", error);
    }
  } catch (error) {
    console.error("\uD658\uACBD\uC124\uC815 \uB85C\uB4DC \uC911 \uC624\uB958 \uBC1C\uC0DD:", error);
  }
}
function registerCommands(context) {
  context.subscriptions.push(
    vscode9.commands.registerCommand("ape.refreshTreeView", () => {
      if (treeDataProvider) {
        treeDataProvider.refresh();
      }
    })
  );
  context.subscriptions.push(
    vscode9.commands.registerCommand("ape.openChat", async () => {
      console.log("\uCC44\uD305 \uBDF0 \uC5F4\uAE30 \uBA85\uB839 \uC2E4\uD589");
      await vscode9.commands.executeCommand("setContext", "ape:showChatView", true);
      await vscode9.commands.executeCommand("workbench.view.extension.ape-sidebar");
      await vscode9.commands.executeCommand("ape.chatView.focus");
    })
  );
  if (coreService && coreService.commandRegistry) {
    const commands4 = coreService.commandRegistry.getCommandMap();
    for (const [id, handler] of commands4.entries()) {
      context.subscriptions.push(
        vscode9.commands.registerCommand(`ape.${id}`, handler)
      );
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
