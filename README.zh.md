# Aliyun Serverless Helper (sr)

一个为 Aliyun Serverless Devs 提供增强功能的 CLI 工具，具有交互式菜单和简化的命令。

主要优化：
* 常用操作的交互式菜单
* 减少命令输入
* 简化的命令语法，提高可用性

## 安装

```bash
# 全局安装
npm install -g aliyun-serverless-helper

# 或从 GitHub 安装
npm install -g github:OldManZhang/aliyun-serverless-helper
```

## 特性

- 常用操作的交互式菜单
- 简化的 Aliyun 函数计算命令语法
- 便捷的实例管理选择
- 支持 FC3 格式（尚未在 FC2 中测试，请先切换到 FC3）
- 针对 Aliyun Serverless 服务优化

## 使用方法

```bash
# 交互模式
sr

# 使用特定模板文件
sr -t ./path/to/s.yaml

# 直接命令
sr deploy [resource-name]
sr invoke [resource-name]

# 实例操作
sr instance list
sr instance log
sr instance exec

# 帮助
sr --help
sr instance --help
```

## 选项

- `-t, --template <path>` - 指定模板文件路径

## 使用对比

### 传统使用方式
```bash
# 部署函数
s resource-name deploy

# 调用函数
s resource-name invoke

# 管理实例
s resource-name instance list
s resource-name logs --instance-id xxx
s resource-name instance exec --instance-id xxx -c "sh"

# 多次指定模板
s resource-name deploy -t ./s.yaml
s resource-name invoke -t ./s.yaml
```

### 使用 Aliyun Serverless Helper 优化方式
```bash
# 交互式部署，带函数选择
sr deploy

# 直接部署指定函数
# #重要# 命令模式：sr [动作] [对象] - 直观且一致的语法
sr deploy resource-name

# 模板感知部署
sr -t ./templates/s.prod.yaml deploy resource-name

# 简化的实例管理
# #重要# 无需先获取 instance-id
sr instance list
sr instance log
sr instance exec

# 一次性指定模板，用于多个命令
sr -t ./templates/s.prod.yaml deploy resource-name
sr -t ./templates/s.prod.yaml invoke resource-name
```

### 主要改进
1. **简化的命令**
   - 减少命令长度
   - 更直观的语法
   - 交互模式提供更好的用户体验

2. **模板管理**
   - 一致的模板处理
   - 环境特定配置
   - 减少重复操作

3. **实例操作**
   - 统一的实例命令
   - 交互式实例选择
   - 简化的日志和执行操作

4. **错误预防**
   - 内置确认提示
   - 函数名称验证
   - 模板文件验证

## 系统要求

- Node.js 12 或更高版本
- 全局安装 Aliyun Serverless Devs (`@serverless-devs/s`)
- 配置有效的 Aliyun 凭证

## 参与贡献

欢迎通过 GitHub 提交您的需求和建议：

1. **提交 Issue**
   - 访问 [GitHub Issues](https://github.com/OldManZhang/aliyun-serverless-helper/issues)
   - 点击 "New Issue" 按钮
   - 选择 Issue 类型（功能建议、问题报告等）
   - 详细描述您的需求或遇到的问题

2. **功能建议**
   - 请尽可能详细地描述您期望的功能
   - 提供使用场景和预期效果
   - 如果有类似功能的参考，请提供链接

3. **问题报告**
   - 提供问题复现步骤
   - 附上相关的错误信息或日志
   - 说明您的运行环境（操作系统、Node.js 版本等）

## 许可证

MIT 