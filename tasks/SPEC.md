# Spec: 水印管家团队全链路功能系统

## Objective

构建一个完整的团队协作水印管理系统，实现从团队管理、数据采集、日报生成到自动化发布的全流程数字化管理。

**核心价值**：
- 提升物业服务质量：通过前后对比，直观展示服务成果
- 加强过程管理：完整的水印信息确保工作真实可靠
- 数据驱动决策：基于历史数据的统计分析支持管理决策
- 提高工作效率：自动化报告生成减少人工整理工作

**目标用户**：
- 物业公司管理人员
- 一线维修/清洁/安保人员
- 业主委员会成员
- 第三方审计人员

**用户故事**：
1. 作为物业管理员，我需要创建和管理团队，以便组织一线工作人员
2. 作为一线工作人员，我需要使用水印相机打卡，以便记录工作现场情况
3. 作为管理员，我需要查看团队打卡数据，以便生成日报并发布
4. 作为业主，我需要查看物业服务报告，以便了解服务质量

## Tech Stack

**前端技术**：
- 微信小程序原生：用户端开发（最新版）
- Vue 3 + Element Plus：管理后台（3.x）
- ECharts：数据可视化（5.x）
- Canvas API：图片处理

**后端技术**：
- Node.js：运行环境（18.x LTS）
- NestJS：后端框架（10.x）
- TypeORM：ORM框架（0.3.x）
- JWT：身份认证
- Swagger：API文档

**数据库技术**：
- MySQL：关系数据存储（8.0）
- MongoDB：图片元数据存储（6.x）
- Redis：缓存和会话（7.x）
- 阿里云OSS：图片文件存储

**中间件**：
- Nginx：反向代理/负载均衡（1.24）
- RabbitMQ：消息队列（3.x）
- Docker：容器化部署（24.x）
- Jenkins：CI/CD

## Commands

```bash
# 开发环境
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run test         # 运行测试
npm run lint         # 代码检查
npm run lint:fix     # 自动修复代码问题

# 数据库
npm run db:migrate   # 运行数据库迁移
npm run db:seed      # 填充测试数据
npm run db:reset     # 重置数据库

# 部署
npm run deploy:dev   # 部署到开发环境
npm run deploy:staging # 部署到预发环境
npm run deploy:prod  # 部署到生产环境
```

## Project Structure

```
mini-watermaker-photo/
├── .agents/                    # Agent skills配置
│   └── skills/                 # 开发流程技能
├── docs/                       # 项目文档
│   ├── 需求文档/               # 需求规格说明
│   ├── 开发文档/               # 技术开发文档
│   ├── 测试验证部署文档/       # 测试和部署文档
│   ├── 产品需求设计文档/       # 产品设计文档
│   └── 文档清单.md             # 文档索引
├── src/                        # 源代码
│   ├── components/             # 组件
│   ├── pages/                  # 页面
│   ├── utils/                  # 工具函数
│   └── types/                  # 类型定义
├── tasks/                      # 任务管理
│   ├── SPEC.md                 # 需求规格说明
│   ├── plan.md                 # 实施计划
│   └── todo.md                 # 任务清单
├── tests/                      # 测试代码
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   └── e2e/                    # 端到端测试
├── package.json                # 项目配置
├── tsconfig.json               # TypeScript配置
└── vite.config.ts              # Vite配置
```

## Code Style

**TypeScript代码风格**：
```typescript
// 使用Prettier格式化
// 使用ESLint进行代码检查
// 使用TypeScript严格模式

// 组件命名：PascalCase
export default defineComponent({
  name: 'WatermarkCamera',
  setup() {
    // 组合式API
    const watermark = ref<WatermarkType>(null)
    
    // 方法命名：camelCase
    const handleCapture = () => {
      // 处理拍照逻辑
    }
    
    return {
      watermark,
      handleCapture
    }
  }
})

// 接口命名：PascalCase，以I开头
interface IUser {
  id: string
  name: string
  role: UserRole
}

// 枚举命名：PascalCase
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// 常量命名：UPPER_SNAKE_CASE
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
```

## Testing Strategy

**测试框架**：
- 单元测试：Jest
- 集成测试：Jest + Supertest
- 端到端测试：Cypress

**测试覆盖率要求**：
- 单元测试覆盖率：≥ 80%
- 集成测试覆盖率：≥ 70%
- 端到端测试覆盖核心流程

**测试文件位置**：
```
src/
├── __tests__/                  # 单元测试
│   ├── components/             # 组件测试
│   ├── utils/                  # 工具函数测试
│   └── services/               # 服务测试
├── __integration__/            # 集成测试
│   ├── api/                    # API测试
│   └── database/               # 数据库测试
└── __e2e__/                    # 端到端测试
    ├── auth/                   # 认证流程测试
    └── workflow/               # 业务流程测试
```

## Boundaries

**Always do**：
- 运行测试后再提交代码
- 遵循命名规范
- 验证用户输入
- 更新相关文档
- 进行代码审查

**Ask first**：
- 数据库架构变更
- 添加新的依赖包
- 修改CI/CD配置
- 更改API接口
- 修改权限模型

**Never do**：
- 提交密钥或敏感信息
- 编辑vendor目录
- 删除失败的测试而不修复
- 跳过代码审查
- 直接修改生产环境

## Success Criteria

**功能完成标准**：
1. 团队管理模块：创建团队、邀请成员、角色权限配置功能完整
2. 打卡功能：水印拍照、位置记录、时间戳功能正常
3. 数据同步：打卡数据自动上传、存储、同步功能正常
4. 日报生成：自动聚合数据、生成日报、预览编辑功能完整
5. 发布系统：定时发布、渠道管理、审核流程功能完整

**性能标准**：
1. 页面加载时间：≤ 2秒
2. API响应时间：≤ 500ms
3. 图片上传时间：≤ 5秒（3G网络）
4. 系统可用性：≥ 99.9%

**质量标准**：
1. 测试覆盖率：单元测试 ≥ 80%，集成测试 ≥ 70%
2. 代码质量：ESLint检查通过，无严重警告
3. 安全性：通过OWASP安全检查
4. 文档完整性：API文档、用户手册、运维手册完整

**验收标准**：
1. 所有P0功能正常运行
2. P1功能完成率 ≥ 90%
3. 无严重Bug（P0/P1级别）
4. 性能测试通过
5. 安全测试通过

## Open Questions

1. **第三方服务集成**：
   - 运动COS对象存储服务的具体接入方式和计费模式？
   - 微信公众号和企业微信的接口权限申请流程？
   - 微信个人号接口的稳定性和限制？

2. **数据安全和隐私**：
   - 用户数据存储和传输的加密标准？
   - 数据备份和恢复策略？
   - 符合哪些数据保护法规？

3. **性能和扩展性**：
   - 预期用户量和并发量？
   - 图片存储容量规划？
   - 系统扩展性要求？

4. **部署和运维**：
   - 部署环境要求（云服务商、服务器配置）？
   - 监控和告警方案？
   - 灾备和恢复计划？

5. **成本预算**：
   - 开发成本预算？
   - 运维成本预算？
   - 第三方服务成本预算？

---

**文档版本**：v1.0  
**创建日期**：2026-08-25  
**维护人**：产品经理  
**状态**：待评审