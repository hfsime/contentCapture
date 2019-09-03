# DataCapture
描述: 数据抓取
------------

## Area
描述: 区域
---------

### 选择区域
#### 请求体1
    选择区域: { 
        opt: "area",
        code: "select"
    }

#### 请求体2
    选择父区域: {
        opt: "area",
        code: "getParent"
    }

#### 响应体
    区域选中: {
        opt: "area",
        code: "selected",
        status: true/false,
        body: {
            areaId: 区域ID
        },
        errorCode: 异常类型
        error: 异常信息
    }


### 区域确认/取消
#### 请求体1
    确认选择区域: {
        opt: "area",
        code: "confirmSelect"
    }

#### 请求体2
    取消选择区域: {
        opt: "area",
        code: "cancelSelect"
    }


### 区域管理
#### 请求体
    删除区域: {
        opt: "area",
        code: "delete",
        body: {
            areaId: 区域ID
        }
    }

## Element

# DataPreview
描述: 数据预览
------------

# ScriptBuild
描述: 代码生成
------------

# ScriptPlayer
描述: 代码执行
------------