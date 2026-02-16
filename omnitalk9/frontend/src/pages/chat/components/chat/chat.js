"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyToClipboard = copyToClipboard;
exports.CopyCode = CopyCode;
var react_1 = require("react");
var classnames_1 = require("classnames");
require("katex/dist/katex.min.css");
var sea_lion_ui_1 = require("sea-lion-ui");
var utils_ts_1 = require("@utils/utils.ts");
var models_ts_1 = require("@constants/models.ts");
var model_config_ts_1 = require("@config/model-config.ts");
var global_config_context_tsx_1 = require("@components/global-config/global-config-context.tsx");
var chat_ts_1 = require("@/store/chat.ts");
var bot_ts_1 = require("@/store/bot.ts");
var chat_module_less_1 = require("./chat.module.less");
var config_ts_1 = require("@/store/config.ts");
function copyToClipboard(text) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1, textArea;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, navigator.clipboard.writeText(text)];
                case 1:
                    _a.sent();
                    sea_lion_ui_1.message.success('copied!');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        sea_lion_ui_1.message.success('copied!');
                    }
                    catch (error) {
                        sea_lion_ui_1.message.error('copy failed');
                    }
                    document.body.removeChild(textArea);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function CopyCode(props) {
    var ref = (0, react_1.useRef)(null);
    var _a = react_1.default.useState(false), showCopy = _a[0], setShowCopy = _a[1];
    var handleClickCopy = function () {
        if (ref.current) {
            var code = ref.current.innerText;
            copyToClipboard(code);
        }
    };
    return (<pre ref={ref}>
            <div onMouseOver={function () { return setShowCopy(true); }} onFocus={function () { return setShowCopy(true); }} onMouseLeave={function () { return setShowCopy(false); }}>
                {/* show copy btn when hover code block */}
                {showCopy && (<span className={chat_module_less_1.default.copyCodeBtn} {...(0, utils_ts_1.getNeedEventCallback)(handleClickCopy)}/>)}
                {props.children}
            </div>
        </pre>);
}
var RunningMario = function () {
    return <div id={chat_module_less_1.default.mario}/>;
};
function ChatMessage(props) {
    var models = (0, react_1.useContext)(global_config_context_tsx_1.GlobalConfigContext).models;
    var _a = (0, react_1.useState)(false), showDate = _a[0], setShowDate = _a[1];
    var _b = (0, react_1.useState)(''), customAvatar = _b[0], setCustomAvatar = _b[1];
    var fileInputRef = (0, react_1.useRef)(null);
    var message = props.message;
    var isUser = message.sender_type === 'user' || message.provider === 'user';
    var isAdmin = message.sender_type === 'admin' || message.provider === 'admin';
    var isClear = message.sender_type === models_ts_1.CLEAR_CONTEXT;
    var className = (0, classnames_1.default)(chat_module_less_1.default.messageWrapper, isUser ? chat_module_less_1.default.chatUser : chat_module_less_1.default.chatBot);
    var configStore = (0, config_ts_1.useConfigStore)();
    (0, react_1.useEffect)(function () {
        var modelKey = message.model || 'user';
        var saved = localStorage.getItem('model_avatar_' + modelKey);
        if (saved) {
            setCustomAvatar(saved);
        }
    }, [message.model]);
    var handleRightClick = function (e) {
        var _a;
        e.preventDefault();
        e.stopPropagation();
        (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    var handleFileChange = function (e) {
        var _a;
        var file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        if (!file.type.startsWith('image/')) {
            sea_lion_ui_1.message.warning('请选择图片文件');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (event) {
            var _a;
            var base64 = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
            var modelKey = message.model || 'user';
            localStorage.setItem('model_avatar_' + modelKey, base64);
            setCustomAvatar(base64);
            sea_lion_ui_1.message.success('头像已更新');
        };
    };
    reader.onerror = function () {
        sea_lion_ui_1.message.error('读取文件失败');
    };
    reader.readAsDataURL(file);
}
;
var getModel = function () {
    if (isUser) {
        return model_config_ts_1.USER_INFO;
    }
    if (isAdmin) {
        return model_config_ts_1.ADMIN_INFO;
    }
    return models[message.model];
};
var model = getModel();
if (!isClear && !model) {
    return null;
}
var isPrivateChat = configStore.mode === 'serial';
var avatarSrc = customAvatar || ((_a = model === null || model === void 0 ? void 0 : model.webui) === null || _a === void 0 ? void 0 : _a.avatar);
return (<div className={chat_module_less_1.default.message} style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }} onMouseEnter={function () { return setShowDate(true); }} onMouseLeave={function () { return setShowDate(false); }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange}/>
            {(isClear) ? (<div className={chat_module_less_1.default.clearLine}>
                    Context cleared
                </div>) : (<>
                    {/* AI 头像 */}
                    {!sea_lion_ui_1.isMobile && !isUser && (<div style={{ background: (_b = model === null || model === void 0 ? void 0 : model.webui) === null || _b === void 0 ? void 0 : _b.background }} className={chat_module_less_1.default.modelAvatar} onContextMenu={handleRightClick} title="右键上传头像">
                            <img src={avatarSrc} className={chat_module_less_1.default.modelAvatarImg} alt={model === null || model === void 0 ? void 0 : model.model}/>
                        </div>)}
                    <div title={message.model || configStore.username} className={className} style={{ borderRadius: !isUser ? '1px 10px 10px 10px' : '10px 1px 10px 10px' }}>
                        {message.stream && <RunningMario />}
                        {!isUser && (<div className={chat_module_less_1.default.chatOperations}>
                                {"".concat(model.provider, " - ").concat(message.model)}
                            </div>)}
                        <react_markdown_1.default className={chat_module_less_1.default.markdownBlock} remarkPlugins={[remark_math_1.default, remark_gfm_1.default, remark_breaks_1.default]} rehypePlugins={[rehype_katex_1.default]} components={{
            code: code_block_tsx_1.default,
            pre: CopyCode,
        }}>
                            {message.text}
                        </react_markdown_1.default>
                        {showDate && (<div className={chat_module_less_1.default.chatDate} style={{ right: isUser ? '0' : 'auto', left: isUser ? 'auto' : '0' }}>
                                {message.date}
                            </div>)}
                    </div>
                    {/* 用户头像 */}
                    {!sea_lion_ui_1.isMobile && isUser && (<div style={{ background: model_config_ts_1.USER_INFO.webui.background }} className={chat_module_less_1.default.modelAvatar} onContextMenu={function (e) {
                var _a;
                e.preventDefault();
                e.stopPropagation();
                (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
            }} title="右键上传头像">
                            {customAvatar ? (<img src={customAvatar} className={chat_module_less_1.default.modelAvatarImg} alt="user"/>) : ('ME')}
                        </div>)}
                </>)}
        </div>);
function ChatSession(props) {
    var session = props.session;
    (0, react_1.useEffect)(function () {
        (0, utils_ts_1.autoScroll)("chat-wrapper-".concat(session.id));
    }, [session.messages.length]);
    return (<div className={chat_module_less_1.default.sessionWrapper}>
            <div className={chat_module_less_1.default.chat} id={"chat-wrapper-".concat(session.id)}>
                {Array.isArray(session.messages) && session.messages.map(function (message, index) {
            return (<div key={message.id} className={chat_module_less_1.default.messageItem}>
                            <ChatMessage key={message.id} message={message} sessionInfo={{
                    id: session.id,
                    name: session.name,
                    bot: session.bot,
                }}/>
                        </div>);
        })}
            </div>
        </div>);
}
var ChatPage = function () {
    var chatStore = (0, chat_ts_1.useChatStore)();
    var botStore = (0, bot_ts_1.useBotStore)();
    var sessions = chatStore.sessions;
    var privateChat = botStore.privateChat;
    return (<div className={chat_module_less_1.default.sessions}>
            {Array.isArray(sessions) && sessions.map(function (session) {
            if (privateChat) {
                if (session.name !== privateChat) {
                    return null;
                }
            }
            return (<ChatSession key={session.id} session={session}/>);
        })}
        </div>);
};
exports.default = ChatPage;
