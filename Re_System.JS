// ==UserScript==
// @name         系统管理面板
// @namespace    http://tampermonkey.net/
// @version      2.4.4
// @description  一个素雅的系统管理面板，包含左中右三个板块
// @icon         https://p3-pc.douyinpic.com/img/aweme-avatar/douyin-user-image-file_d94be463567406ff89d93cbd2c6d4290~c5_300x300.jpeg
// @author       KireMing
// @match        https://backendproenv.aixzu.com/app-pre-auth-order/index*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_getTab
// @grant        GM_saveTab
// @grant        GM_getTabs
// @updateURL    https://ghfast.top/https://raw.githubusercontent.com/KireMing/Ohshit/main/Re_System.JS
// @downloadURL  https://ghfast.top/https://raw.githubusercontent.com/KireMing/Ohshit/main/Re_System.JS
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    try {
        if (localStorage.getItem('OpenBoard') === 'False') {
            return;
        }
    } catch (e) {
        // localStorage 不可用——正常运行脚本
    }

    const CONFIG = {
        API: {
            BASE_URL: 'https://backendproenv.aixzu.com',
            ENDPOINTS: {
                multiRentRisk: '/multi-rent-risk/index',
                v4Risk: '/risk/index-v4',
                legalStatus: '/symbol-risk/index',
                staffRemark: '/order-staff-remark/add',
                riskRemark: '/replenish-audit-data/add-risk-answer',
                riskQuestion: '/replenish-audit-data/show-risk-question',
                mobileUseTime: '/mobile-use-time/search-v2',
                replenishAudit: '/replenish-audit-data/add',
                paylogAllot: '/paylog/allot'
            }
        },
        XPATH: {
            MAIN_PAGE: {
                name: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[3]/p[1]/text()',
                idCard: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[3]/p[6]/span',
                model: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[3]/p[9]/text()',
                orderCountContainer: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[3]',
                productModel: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[2]',
                minDownPayment: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[6]/p[5]',
                packageInfo1: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[3]',
                packageInfo2: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[5]/span',
                shopCategory: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[8]',
                link: '/html/body/div[2]/div[2]/form/table/tbody/tr/td[1]/a[1]',
                newChainLink: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]',
                valueAddedServiceCheck: '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[2]'
            },
            MULTI_RENT_PAGE: {
                newRent: '/html/body/div[2]/div/table/tbody/tr[4]/td[2]',
                todayApply: '/html/body/div[2]/div/table/tbody/tr[5]/td[2]',
                day7Apply: '/html/body/div[2]/div/table/tbody/tr[6]/td[2]',
                day30Apply: '/html/body/div[2]/div/table/tbody/tr[7]/td[2]',
                riskLevel: '/html/body/div[2]/div/table/tbody/tr[8]/td[2]'
            },
            V4_RISK_PAGE: {
                v4Risk: '/html/body/div[2]/div/form/table/tbody/tr[2]/td[2]/span[1]/text()'
            },
            LEGAL_PAGE: {
                legalStatus: '/html/body/div[2]/table[1]/tbody/tr/td[4]'
            },
            LINKED_PAGE: {
                phoneCost: '/html/body/div[2]/table[4]/tbody/tr/td[6]/span',
                guidePrice: '/html/body/div[2]/table[4]/tbody/tr/td[4]'
            },
            MOBILE_USE_TIME_PAGE: {
                duration: '/html/body/div[2]/div/table/tbody/tr[2]/td'
            }
        },
        THRESHOLD: {
            overdueWarning: 8,
            offlineWarning: 10,
            overageAge: 50,
            repeatCustomer: 2,
            shopRemarkTruncate: 10,
            modelNameTruncate: 15
        },
        TIME: {
            debounceDelay: 300,
            toastDuration: 3000,
            autoRefreshDelay: 800,
            processCompleteDelay: 2000,
            idCardFetchDelay: 500,
            autoFetchDelay: 100,
            loadTimeout: 30000,
            iframeLoadTimeout: 1000,
            clickDelay: 10
        },
        STORAGE: {
            appearanceKey: 're_appearance_settings',
            autoAgeKey: 're-auto-age-enabled',
            autoFetchKey: 're-auto-fetch-enabled',
            autoContactQueryKey: 're-auto-contact-query-enabled',
            preventRefreshKey: 're-prevent-refresh-enabled',
            autoRefreshKey: 're-auto-refresh-enabled',
            lowPerfKey: 're-low-perf-enabled',
            restDaysKey: 're-rest-days',
            editedDaysKey: 're-edited-days',
            riskPanelEnabledKey: 're-risk-panel-enabled'
        },
        DEFAULTS: {
            bgColor: '#e8eaed',
            bgOpacity: 80,
            fontSize: 14,
            fontBold: false
        },
        CHART: {
            hitRadius: 15,
            maxModelDisplay: 10,
            yGridCount: 5
        }
    };

    const panelHTML = `
        <div id="re-system-panel" class="re-panel-hidden">
            <div class="re-panel-header">
                <div class="re-panel-header-left">
                    <span class="re-panel-title">系统管理面板</span>
                    <span class="re-panel-version">V2.4.4</span>
                </div>
                <span class="re-panel-staff" id="re-staff-name"></span>
            </div>
            <div class="re-panel-resize-handle"></div>
            <div class="re-risk-panel" id="re-risk-panel">
                <div class="re-risk-panel-header">
                    <div class="re-risk-panel-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span>风险异常</span>
                        <span class="re-risk-count" id="re-risk-count">(0)</span>
                    </div>
                    <button class="re-risk-panel-close" id="re-risk-panel-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="re-risk-panel-content" id="re-risk-panel-content">
                    <div class="re-risk-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                        <span>所有检测项正常</span>
                    </div>
                </div>
            </div>
            <div class="re-drag-ghost">
                <span class="re-drag-ghost-text">移动中...</span>
                <button class="re-drag-cancel" id="re-drag-cancel-btn">取消移动</button>
            </div>
            <div class="re-no-lock-panel" id="re-no-lock-panel">
                <div class="re-no-lock-header">
                    <span class="re-no-lock-title">无锁判断</span>
                    <span class="re-no-lock-status" id="re-nl-status">待计算</span>
                    <button class="re-no-lock-close" id="re-no-lock-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="re-no-lock-content">
                    <div class="re-no-lock-grid">
                        <div class="re-no-lock-item">
                            <span class="re-no-lock-label">分付:</span>
                            <span class="re-no-lock-value" id="re-nl-fenfu">未开通</span>
                        </div>
                        <div class="re-no-lock-item">
                            <span class="re-no-lock-label">花呗:</span>
                            <span class="re-no-lock-value" id="re-nl-huabei">未开通</span>
                        </div>
                        <div class="re-no-lock-item">
                            <span class="re-no-lock-label">抖音:</span>
                            <span class="re-no-lock-value" id="re-nl-douyin">未开通</span>
                        </div>
                        <div class="re-no-lock-item">
                            <span class="re-no-lock-label">美团:</span>
                            <span class="re-no-lock-value" id="re-nl-meituan">未开通</span>
                        </div>
                    </div>
                    <div class="re-no-lock-divider"></div>
                    <div class="re-no-lock-row">
                        <span class="re-no-lock-label">总计额度:</span>
                        <span class="re-no-lock-value" id="re-nl-total">0.00</span>
                    </div>
                    <div class="re-no-lock-row">
                        <span class="re-no-lock-label">有锁结果:</span>
                        <span class="re-no-lock-value" id="re-nl-v4">0.00</span>
                    </div>
                    <div class="re-no-lock-row re-no-lock-editable">
                        <span class="re-no-lock-label">手机成本:</span>
                        <input type="text" class="re-no-lock-input" id="re-nl-cost-input" placeholder="请输入成本">
                        <button class="re-no-lock-recalc" id="re-nl-recalc">重算</button>
                    </div>
                    <div class="re-no-lock-divider"></div>
                    <div class="re-no-lock-row">
                        <span class="re-no-lock-label">额度比例:</span>
                        <span class="re-no-lock-value" id="re-nl-ratio">0.00%</span>
                    </div>
                    <div class="re-no-lock-row">
                        <span class="re-no-lock-label">无锁最低:</span>
                        <span class="re-no-lock-value" id="re-nl-min">0.00</span>
                    </div>
                    <div class="re-no-lock-divider"></div>
                    <div class="re-no-lock-preview">
                        <div class="re-no-lock-preview-header">
                            <div class="re-no-lock-preview-title">备注预览</div>
                            <div class="re-no-lock-preview-actions">
                                <button class="re-no-lock-action-btn" id="re-nl-submit-remark" title="提交客服备注">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                </button>
                                <button class="re-no-lock-copy-btn" id="re-nl-copy-remark" title="复制">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                </button>
                            </div>
                        </div>
                        <textarea class="re-no-lock-preview-text" id="re-nl-preview-remark" readonly></textarea>
                    </div>
                    <div class="re-no-lock-preview">
                        <div class="re-no-lock-preview-header">
                            <div class="re-no-lock-preview-title">登记Excel预览</div>
                            <button class="re-no-lock-copy-btn" id="re-nl-copy-excel" title="复制">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                        </div>
                        <textarea class="re-no-lock-preview-text" id="re-nl-preview-excel" readonly></textarea>
                    </div>
                </div>
            </div>
            <div class="re-panel-content">
                <div class="re-column re-column-left">
                    <div class="re-column-header">导航</div>
                    <div class="re-column-content">
                        <ul class="re-nav-list">
                            <li class="re-nav-item active" data-page="data" title="数据">
                                <svg class="re-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                            </li>
                            <li class="re-nav-item" data-page="settings" title="设置">
                                <svg class="re-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            </li>
                            <li class="re-nav-item" data-page="history" title="历史">
                                <svg class="re-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </li>
                            <li class="re-nav-item" data-page="analysis" title="分析">
                                <svg class="re-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="re-column re-column-center">
                    <div class="re-column-header">
                        <span class="re-header-title">主内容区</span>
                        <span class="re-header-data">【客户办单：数据丢失】 你 0岁 数据丢失【SJMM旗舰店】</span>
                    </div>
                    <div class="re-column-content" id="re-main-content">
                        <div class="re-form-section" id="re-page-data">
                            <div class="re-form-group">
                                <div class="re-form-title">基础选项</div>
                                <div class="re-form-row">
                                    <div class="re-form-item-inline">
                                        <label class="re-form-label">旧机选项</label>
                                        <div class="re-form-inline">
                                            <label class="re-switch">
                                                <input type="checkbox" id="re-old-device" checked>
                                                <span class="re-switch-slider"></span>
                                            </label>
                                            <select class="re-select re-select-small re-old-device-select" id="re-old-device-type" style="display: none;">
                                                <option>用作备用</option>
                                                <option>给家里人</option>
                                                <option>太旧不置换</option>
                                                <option>太烂不想卖</option>
                                            </select>
                                            <span class="re-switch-content re-visible">
                                                <input type="text" class="re-input re-input-small" id="re-old-device-amount" placeholder="额度">
                                            </span>
                                        </div>
                                    </div>
                                    <div class="re-form-item-inline re-form-item-work">
                                        <label class="re-form-label">工作选项</label>
                                        <div class="re-form-inline re-form-work">
                                            <label class="re-switch">
                                                <input type="checkbox" id="re-work-option" checked>
                                                <span class="re-switch-slider"></span>
                                            </label>
                                            <span class="re-switch-content">
                                                <input type="text" class="re-input" id="re-work-content" placeholder="内容">
                                                <input type="text" class="re-input re-input-small" id="re-work-amount" placeholder="金额">
                                                <select class="re-select re-select-small" id="re-salary-type">
                                                    <option>日薪</option>
                                                    <option selected>月薪</option>
                                                    <option>时薪</option>
                                                    <option>周薪</option>
                                                </select>
                                                <div class="re-multi-select" id="re-work-proof">
                                                    <div class="re-multi-select-header">
                                                        <span class="re-multi-select-text">选择证明</span>
                                                        <svg class="re-multi-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </div>
                                                    <div class="re-multi-select-dropdown">
                                                        <div class="re-multi-select-items"></div>
                                                        <div class="re-multi-select-manage" id="re-work-proof-manage">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                                            </svg>
                                                            <span>管理选项</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="re-form-group">
                                <div class="re-form-title">流水信息</div>
                                <div class="re-flow-grid re-flow-grid-4 re-flow-section">
                                    <div class="re-flow-item">
                                        <label class="re-form-label">微信流水</label>
                                        <input type="text" class="re-input re-input-mini" id="re-wechat-flow" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">支宝流水</label>
                                        <input type="text" class="re-input re-input-mini" id="re-alipay-flow" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">芝麻信用</label>
                                        <input type="text" class="re-input re-input-mini" id="re-zhima-credit" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">花呗情况</label>
                                        <input type="text" class="re-input re-input-mini" id="re-huabei-status" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">微信分付</label>
                                        <input type="text" class="re-input re-input-mini" id="re-wechat-fenfu" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">抖音月付</label>
                                        <input type="text" class="re-input re-input-mini" id="re-douyin-pay" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">美团月付</label>
                                        <input type="text" class="re-input re-input-mini" id="re-meituan-pay" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">支付分</label>
                                        <input type="text" class="re-input re-input-mini" id="re-wechat-credit-score" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">手机成本</label>
                                        <div class="re-price-wrapper">
                                            <input type="text" class="re-input re-input-mini re-phone-cost-input" id="re-phone-cost" value="¥9,999.00" readonly>
                                            <span class="re-price-diff-container" id="re-phone-cost-diff"></span>
                                        </div>
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">指导价格</label>
                                        <input type="text" class="re-input re-input-mini re-guide-price-input" id="re-guide-price" value="¥1,999.00" readonly>
                                    </div>
                                    <div class="re-flow-item re-flow-item-full">
                                        <label class="re-form-label">共租情况</label>
                                        <input type="text" class="re-input" id="re-share-rent" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item re-flow-item-full">
                                        <label class="re-form-label">其他备注</label>
                                        <input type="text" class="re-input re-other-remark-input" id="re-other-remark" placeholder="请输入">
                                    </div>
                                </div>
                            </div>
                            <div class="re-data-section re-data-section-3">
                                <div class="re-data-col">
                                    <div class="re-card-title">
                                        <span class="re-card-title-text">订单信息</span>
                                        <svg class="re-refresh-icon" id="re-order-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">订单序号</span>
                                        <span class="re-data-value" id="re-order-no">【无参数】</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">共租维度</span>
                                        <span class="re-data-value" id="re-new-rent"></span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">当日申请</span>
                                        <span class="re-data-value" id="re-today-apply"></span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">近7日申请</span>
                                        <span class="re-data-value" id="re-7day-apply"></span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">近30日申请</span>
                                        <span class="re-data-value" id="re-30day-apply"></span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">综合风险</span>
                                        <span class="re-data-value" id="re-risk-level"></span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">新版V4风控</span>
                                        <span class="re-data-value" id="re-v4-risk"></span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">法律状态</span>
                                        <span class="re-data-value re-clickable" id="re-legal-status"></span>
                                    </div>
                                </div>
                                <div class="re-data-col">
                                    <div class="re-card-title">
                                        <span>商品信息</span>
                                        <span class="re-member-amount" id="re-member-amount" style="display: none;"></span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">机型型号</span>
                                        <span class="re-data-value" id="re-product-info">iPhone 15 Pro Max 256GB</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">最低首付</span>
                                        <span class="re-data-value" id="re-min-down-payment">¥1,500.00</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">套餐信息</span>
                                        <span class="re-data-value" id="re-package-info">12期免息套餐</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">办单次数</span>
                                        <span class="re-data-value" id="re-shop-order-count">156 次</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">店铺备注</span>
                                        <span class="re-data-value re-value-remark" id="re-shop-remark">暂无备注</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">店铺类别</span>
                                        <span class="re-data-value" id="re-shop-category">出资商家</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">店铺逾期</span>
                                        <span class="re-data-value re-value-success re-clickable" id="re-shop-overdue">--</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">店铺离线</span>
                                        <span class="re-data-value re-value-success re-clickable" id="re-shop-offline">--</span>
                                    </div>
                                </div>
                                <div class="re-data-col">
                                    <div class="re-card-title" id="re-expand-business-title"><span class="re-expand-title-text">拓展业务</span><span class="re-expand-badges" id="re-expand-restrict-badge" style="display:none;"></span></div>
                                    <div class="re-data-form">
                                        <div class="re-data-form-row">
                                            <div class="re-data-form-inline">
                                                <label class="re-form-label">审核价格</label>
                                                <input type="text" class="re-input re-price-input" id="re-audit-result" placeholder="请输入">
                                            </div>
                                            <div class="re-data-form-inline">
                                                <label class="re-form-label">审核结果</label>
                                                <select class="re-select" id="re-order-result">
                                                    <option>通过</option>
                                                    <option selected>考虑</option>
                                                    <option>取消</option>
                                                    <option>支付不了</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="re-data-form-row">
                                            <div class="re-data-form-inline re-expand-result-row">
                                                <label class="re-form-label">拓展价格</label>
                                                <input type="text" class="re-input re-price-input" id="re-expand-result" placeholder="请输入">
                                                <label class="re-form-label">拓展结果</label>
                                                <select class="re-select" id="re-expand-order-result">
                                                    <option>通过</option>
                                                    <option selected>考虑</option>
                                                    <option>取消</option>
                                                    <option>支付不了</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="re-data-form-row">
                                            <div class="re-data-form-inline">
                                                <label class="re-form-label">办理方式</label>
                                                <select class="re-select" id="re-handle-method">
                                                    <option>到店办理</option>
                                                    <option>共享屏幕</option>
                                                    <option>腾讯会议</option>
                                                </select>
                                            </div>
                                            <div class="re-data-form-inline">
                                                <label class="re-form-label">拓展</label>
                                                <label class="re-switch">
                                                    <input type="checkbox" id="re-rent-expand">
                                                    <span class="re-switch-slider"></span>
                                                </label>
                                                <select class="re-select re-rent-expand-select" id="re-expand-type">
                                                </select>
                                            </div>
                                        </div>
                                        <div class="re-data-form-row">
                                            <div class="re-data-form-inline re-data-form-full">
                                                <label class="re-form-label">特殊备注</label>
                                                <input type="text" class="re-input" id="re-special-remark" placeholder="请输入">
                                            </div>
                                        </div>
                                        <div class="re-preview-box">
                                            <div class="re-preview-content" id="re-preview-content">
                                                <span id="re-preview-main"></span>
                                                <span class="re-preview-expand" id="re-preview-expand"></span>
                                                <span id="re-preview-remark"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="re-form-section" id="re-page-settings" style="display: none;">
                            <div class="re-settings-container">
                                <div class="re-settings-tabs">
                                    <button class="re-settings-tab active" data-tab="basic">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                                        <span>基础设置</span>
                                    </button>
                                    <button class="re-settings-tab" data-tab="appearance">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                                        <span>外观设置</span>
                                    </button>
                                </div>
                                <div class="re-settings-content">
                                    <div class="re-settings-panel active" id="re-settings-basic">
                                        <div class="re-settings-grid">
                                            <div class="re-setting-card">
                                                <div class="re-setting-icon re-setting-icon-blue">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                </div>
                                                <div class="re-setting-info">
                                                    <span class="re-setting-name">自动年龄</span>
                                                    <span class="re-setting-desc">根据身份证号自动计算年龄</span>
                                                </div>
                                                <label class="re-switch re-switch-small">
                                                    <input type="checkbox" id="re-setting-auto-age">
                                                    <span class="re-switch-slider"></span>
                                                </label>
                                            </div>
                                            <div class="re-setting-card">
                                                <div class="re-setting-icon re-setting-icon-green">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                                </div>
                                                <div class="re-setting-info">
                                                    <span class="re-setting-name">自动获取订单</span>
                                                    <span class="re-setting-desc">打开面板时自动获取订单信息</span>
                                                </div>
                                                <label class="re-switch re-switch-small">
                                                    <input type="checkbox" id="re-setting-auto-fetch">
                                                    <span class="re-switch-slider"></span>
                                                </label>
                                            </div>
                                            <div class="re-setting-card">
                                                <div class="re-setting-icon re-setting-icon-purple">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                                </div>
                                                <div class="re-setting-info">
                                                    <span class="re-setting-name">自动查询联系人</span>
                                                    <span class="re-setting-desc">打开面板时自动查询手机号使用时长</span>
                                                </div>
                                                <label class="re-switch re-switch-small">
                                                    <input type="checkbox" id="re-setting-auto-contact-query">
                                                    <span class="re-switch-slider"></span>
                                                </label>
                                            </div>
                                            <div class="re-setting-card">
                                                <div class="re-setting-icon re-setting-icon-orange">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                </div>
                                                <div class="re-setting-info">
                                                    <span class="re-setting-name">防手误刷新</span>
                                                    <span class="re-setting-desc">芝麻信用有数据时刷新页面需确认</span>
                                                </div>
                                                <label class="re-switch re-switch-small">
                                                    <input type="checkbox" id="re-setting-prevent-refresh">
                                                    <span class="re-switch-slider"></span>
                                                </label>
                                            </div>
                                            <div class="re-setting-card">
                                                <div class="re-setting-icon re-setting-icon-cyan">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                                                </div>
                                                <div class="re-setting-info">
                                                    <span class="re-setting-name">自动刷新</span>
                                                    <span class="re-setting-desc">自动处理完成后自动刷新页面</span>
                                                </div>
                                                <label class="re-switch re-switch-small">
                                                    <input type="checkbox" id="re-setting-auto-refresh" checked>
                                                    <span class="re-switch-slider"></span>
                                                </label>
                                            </div>
                                            <div class="re-setting-card">
                                                <div class="re-setting-icon re-setting-icon-red">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                                </div>
                                                <div class="re-setting-info">
                                                    <span class="re-setting-name">低性能模式</span>
                                                    <span class="re-setting-desc">禁用模糊和动画，提升Chrome流畅度</span>
                                                </div>
                                                <label class="re-switch re-switch-small">
                                                    <input type="checkbox" id="re-setting-low-perf">
                                                    <span class="re-switch-slider"></span>
                                                </label>
                                            </div>
                                            <div class="re-setting-card">
                                                <div class="re-setting-icon re-setting-icon-red">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                </div>
                                                <div class="re-setting-info">
                                                    <span class="re-setting-name">风险评估</span>
                                                    <span class="re-setting-desc">右侧显示风险异常汇总面板</span>
                                                </div>
                                                <label class="re-switch re-switch-small">
                                                    <input type="checkbox" id="re-setting-risk-panel">
                                                    <span class="re-switch-slider"></span>
                                                </label>
                                            </div>
                                            <div class="re-setting-card" id="re-setting-staff-name-card" style="cursor:pointer;">
                                                <div class="re-setting-icon re-setting-icon-indigo">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                </div>
                                                <div class="re-setting-info">
                                                    <span class="re-setting-name">修改姓名</span>
                                                    <span class="re-setting-desc" id="re-setting-staff-desc">当前：未设置</span>
                                                </div>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:#9ca3af;flex-shrink:0;"><polyline points="15 3 21 9 9 21H3v-6L15 3z"/></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="re-settings-panel" id="re-settings-appearance">
                                        <div class="re-appearance-section">
                                            <div class="re-appearance-item">
                                                <div class="re-appearance-header">
                                                    <span class="re-appearance-title">背板颜色</span>
                                                    <span class="re-appearance-desc">自定义面板背景颜色</span>
                                                </div>
                                                <div class="re-appearance-control">
                                                    <input type="color" id="re-setting-bg-color" value="#e8eaed" class="re-color-picker">
                                                    <button class="re-btn-sm" id="re-reset-bg-color">重置</button>
                                                </div>
                                            </div>
                                            <div class="re-appearance-item">
                                                <div class="re-appearance-header">
                                                    <span class="re-appearance-title">背景图片</span>
                                                    <span class="re-appearance-desc">上传自定义背景图片</span>
                                                </div>
                                                <div class="re-appearance-control">
                                                    <label class="re-file-upload-btn" id="re-bg-image-upload-label">
                                                        选择图片
                                                        <input type="file" id="re-setting-bg-image" accept="image/jpeg,image/png,image/webp" style="display:none">
                                                    </label>
                                                    <span id="re-bg-image-name" class="re-filename-text"></span>
                                                    <button class="re-btn-sm re-btn-danger" id="re-clear-bg-image" style="display:none;">清除</button>
                                                </div>
                                            </div>
                                            <div class="re-appearance-item">
                                                <div class="re-appearance-header">
                                                    <span class="re-appearance-title">背景透明度</span>
                                                    <span class="re-appearance-desc">调整背景图片的透明度</span>
                                                </div>
                                                <div class="re-appearance-control">
                                                    <input type="range" id="re-setting-bg-opacity" min="0" max="100" value="80" class="re-range-slider">
                                                    <span id="re-opacity-value" class="re-opacity-text">80%</span>
                                                </div>
                                            </div>
                                            <div class="re-appearance-item">
                                                <div class="re-appearance-header">
                                                    <span class="re-appearance-title">字体大小</span>
                                                    <span class="re-appearance-desc">调整面板文字大小</span>
                                                </div>
                                                <div class="re-appearance-control">
                                                    <input type="range" id="re-setting-font-size" min="12" max="18" step="1" value="14" class="re-range-slider">
                                                    <span id="re-font-size-value" class="re-opacity-text">14px</span>
                                                </div>
                                            </div>
                                            <div class="re-appearance-item">
                                                <div class="re-appearance-header">
                                                    <span class="re-appearance-title">字体加粗</span>
                                                    <span class="re-appearance-desc">面板文字加粗显示</span>
                                                </div>
                                                <div class="re-appearance-control">
                                                    <label class="re-switch re-switch-small">
                                                        <input type="checkbox" id="re-setting-font-bold">
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="re-appearance-preview">
                                                <span class="re-appearance-preview-title">预览效果</span>
                                                <div class="re-preview-card" id="re-bg-preview-card">
                                                    <div class="re-preview-inner" id="re-bg-preview-inner"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="re-form-section" id="re-page-history" style="display: none;">
                            <div class="re-history-search">
                                <svg class="re-history-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input type="text" class="re-history-search-input" id="re-history-search" placeholder="搜索客户姓名...">
                            </div>
                            <div class="re-history-container" id="re-history-container">
                                <div class="re-history-empty" id="re-history-empty">
                                    <svg class="re-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    <div class="re-empty-text">暂无历史记录</div>
                                </div>
                            </div>
                        </div>
                        <div class="re-form-section" id="re-page-analysis" style="display: none;">
                            <div class="re-analysis-container">
                                <div class="re-analysis-section">
                                    <div class="re-analysis-header">
                                        <span class="re-analysis-title">订单趋势分析</span>
                                        <span class="re-analysis-badge" id="re-analysis-month-label">当月</span>
                                    </div>
                                    <div class="re-chart-card">
                                        <canvas id="re-order-chart"></canvas>
                                        <div id="re-chart-tooltip" class="re-chart-tooltip" style="display: none;"></div>
                                    </div>
                                    <div class="re-analysis-stats">
                                        <div class="re-stat-card">
                                            <div class="re-stat-value" id="re-stat-total">0</div>
                                            <div class="re-stat-label">总订单</div>
                                        </div>
                                        <div class="re-stat-card">
                                            <div class="re-stat-value" id="re-stat-daily-avg">0</div>
                                            <div class="re-stat-label">日均</div>
                                        </div>
                                        <div class="re-stat-card re-stat-high">
                                            <div class="re-stat-value" id="re-stat-max-orders">0</div>
                                            <div class="re-stat-label" id="re-stat-max-date">最高</div>
                                        </div>
                                        <div class="re-stat-card re-stat-low">
                                            <div class="re-stat-value" id="re-stat-min-orders">0</div>
                                            <div class="re-stat-label" id="re-stat-min-date">最低</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="re-analysis-divider"></div>
                                <div class="re-analysis-section">
                                    <div class="re-analysis-header">
                                        <span class="re-analysis-title">机型审核量分析</span>
                                        <span class="re-analysis-badge">Top 5</span>
                                    </div>
                                    <div class="re-chart-card">
                                        <canvas id="re-model-chart"></canvas>
                                        <div id="re-model-tooltip" class="re-chart-tooltip" style="display: none;"></div>
                                    </div>
                                    <div class="re-model-legend" id="re-model-legend"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="re-column re-column-right" id="re-right-column">
                    <div class="re-column-header">信息栏</div>
                    <div class="re-column-content">
                        <div class="re-info-card">
                            <div class="re-info-title">监管机信息</div>
                            <div class="re-info-list">
                                <div class="re-info-item">
                                    <span class="re-info-label">机型</span>
                                    <span class="re-info-value" id="re-device-model">iPhone 15 Pro Max 256GB</span>
                                </div>
                                <div class="re-info-item">
                                    <span class="re-info-label">价格</span>
                                    <span class="re-info-value" id="re-device-price">¥9,999.00</span>
                                </div>
                            </div>
                        </div>
                        <div class="re-action-buttons">
                            <button class="re-action-btn" id="re-btn-staff-assign">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                客服分配
                            </button>
                            <button class="re-action-btn" id="re-btn-staff-remark">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                客服备注
                            </button>
                            <button class="re-action-btn" id="re-btn-risk-remark">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                风控备注
                            </button>
                            <button class="re-action-btn">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                记录备注
                            </button>
                            <button class="re-action-btn" id="re-btn-auto-process">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 4 12 14.01 9 11.01"/><circle cx="12" cy="12" r="10"/></svg>
                                自动处理
                            </button>
                            <button class="re-action-btn" id="re-btn-no-lock">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                                无锁操作
                            </button>
                        </div>
                        <div class="re-contact-info" id="re-contact-section">
                            <div class="re-contact-item">
                                <span class="re-contact-label">姓名</span>
                                <span class="re-contact-value" id="re-contact-name">【无参数】</span>
                            </div>
                            <div class="re-contact-item">
                                <span class="re-contact-label">关系</span>
                                <span class="re-contact-value" id="re-contact-relation">本人</span>
                            </div>
                            <div class="re-contact-item">
                                <span class="re-contact-label">手机号</span>
                                <span class="re-contact-value" id="re-contact-phone">【无参数】</span>
                            </div>
                            <div class="re-contact-actions">
                                <button class="re-contact-btn" id="re-contact-query">查询</button>
                                <button class="re-contact-btn" id="re-contact-edit">编辑</button>
                                <span class="re-phone-duration" id="re-phone-duration"></span>
                            </div>
                        </div>
                        <div class="re-risk-preview" id="re-risk-section">
                            <div class="re-risk-preview-header">
                                <span class="re-risk-preview-title">风控预览</span>
                                <svg class="re-risk-copy-icon" id="re-risk-copy-btn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </div>
                            <div class="re-risk-preview-content" id="re-risk-preview-text">暂无数据</div>
                            <div class="re-risk-reduction" id="re-risk-reduction"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="re-modal-overlay" id="re-confirm-modal">
            <div class="re-modal re-modal-confirm">
                <div class="re-modal-header">
                    <span class="re-modal-title">提示</span>
                </div>
                <div class="re-modal-content" id="re-confirm-content">身份证信息已隐藏，是否需要获取年龄？</div>
                <div class="re-modal-footer">
                    <button class="re-btn re-btn-default" id="re-confirm-cancel">取消</button>
                    <button class="re-btn re-btn-primary" id="re-confirm-ok">确定</button>
                </div>
            </div>
        </div>
        <div class="re-modal-overlay" id="re-model-orders-modal">
            <div class="re-modal re-modal-model-orders">
                <div class="re-modal-header">
                    <span class="re-modal-title" id="re-model-orders-title">机型订单列表</span>
                    <button class="re-modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="re-modal-content">
                    <div class="re-model-orders-list" id="re-model-orders-list"></div>
                </div>
            </div>
        </div>
        <div class="re-modal-overlay" id="re-order-detail-modal">
            <div class="re-modal re-modal-order-detail">
                <div class="re-modal-header">
                    <span class="re-modal-title" id="re-order-detail-title">订单详情</span>
                    <button class="re-modal-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="re-modal-content">
                    <div class="re-order-detail-content" id="re-order-detail-content"></div>
                </div>
            </div>
        </div>

        <div class="re-modal-overlay" id="re-repeat-orders-modal">
            <div class="re-modal re-modal-model-orders">
                <div class="re-modal-header">
                    <span class="re-modal-title" id="re-repeat-orders-title">历史订单列表</span>
                    <button class="re-modal-close" id="re-repeat-orders-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="re-modal-content">
                    <div class="re-model-orders-list" id="re-repeat-orders-list"></div>
                </div>
            </div>
        </div>
    `;

    const styles = `
        #re-system-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 65%;
            height: 70%;
            min-width: 800px;
            min-height: 500px;
            max-width: 95vw;
            max-height: 95vh;
            background: linear-gradient(135deg, #e8eaed 0%, #d1d5db 50%, #e5e7eb 100%);
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            overflow: visible;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            will-change: transform;
        }

        #re-system-panel.re-dragging {
            transition: none !important;
        }

        #re-system-panel.re-dragging .re-panel-content,
        #re-system-panel.re-dragging .re-panel-header {
            display: none !important;
        }

        #re-system-panel.re-dragging::before,
        #re-system-panel.re-dragging::after {
            display: none;
        }

        .re-drag-ghost {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(59, 130, 246, 0.08);
            border: 2px dashed rgba(59, 130, 246, 0.4);
            border-radius: 16px;
            pointer-events: none;
            display: none;
            z-index: 100;
        }

        #re-system-panel.re-dragging .re-drag-ghost {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
        }

        .re-drag-ghost-text {
            font-size: 14px;
            color: #3b82f6;
            font-weight: 500;
        }

        .re-drag-cancel {
            padding: 8px 20px;
            background: #fff;
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 6px;
            color: #3b82f6;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            pointer-events: auto;
        }

        .re-drag-cancel:hover {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
        }

        #re-system-panel::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background:
                linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%),
                linear-gradient(0deg, transparent 0%, rgba(59, 130, 246, 0.03) 50%, transparent 100%);
            background-size: 200% 200%;
            pointer-events: none;
            z-index: 0;
        }

        #re-system-panel::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background:
                radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 70%, rgba(96, 165, 250, 0.06) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(147, 197, 253, 0.04) 0%, transparent 60%);
            pointer-events: none;
            z-index: 0;
        }

        #re-system-panel * {
            box-sizing: border-box;
        }

        .re-panel-hidden {
            display: none !important;
        }

        .re-panel-visible {
        }

        .re-panel-closing {
        }

        .re-panel-header {
            position: relative;
            z-index: 10;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 16px;
            background: linear-gradient(135deg, rgba(107, 114, 128, 0.95) 0%, rgba(75, 85, 99, 0.95) 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px 16px 0 0;
            cursor: move;
            user-select: none;
        }

        .re-panel-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .re-panel-title {
            font-size: 14px;
            font-weight: 500;
            color: #ffffff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .re-panel-version {
            font-size: 11px;
            font-weight: 600;
            padding: 3px 10px;
            border-radius: 20px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #ffffff;
            letter-spacing: 0.3px;
            box-shadow: 0 2px 6px rgba(251, 191, 36, 0.3);
            white-space: nowrap;
        }

        .re-panel-staff {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.85);
            margin-left: auto;
            padding-right: 16px;
        }

        .re-panel-resize-handle {
            position: absolute;
            right: 0;
            bottom: 0;
            width: 20px;
            height: 20px;
            cursor: nwse-resize;
            z-index: 20;
        }

        .re-panel-resize-handle::before {
            content: '';
            position: absolute;
            right: 4px;
            bottom: 4px;
            width: 12px;
            height: 12px;
            border-right: 2px solid rgba(107, 114, 128, 0.5);
            border-bottom: 2px solid rgba(107, 114, 128, 0.5);
        }

        .re-panel-content {
            position: relative;
            z-index: 5;
            display: flex;
            flex: 1;
            overflow: hidden;
            border-radius: 0 0 16px 16px;
        }

        .re-column {
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(10px);
        }

        .re-column-left {
            width: 52px;
            min-width: 52px;
            border-right: 1px solid rgba(107, 114, 128, 0.2);
            overflow: hidden;
        }

        .re-column-center {
            flex: 1;
            min-width: 300px;
        }

        .re-column-center .re-column-header {
            display: flex;
            align-items: center;
            position: relative;
        }

        .re-header-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            flex-shrink: 0;
        }

        .re-header-data {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
        }

        .re-header-data.highlight-gold {
        }

        .re-new-chain-link {
            display: inline-block;
            background: #f97316;
            color: #fff;
            font-size: 13px;
            padding: 2px 8px;
            border-radius: 4px;
            margin-right: 6px;
            font-weight: 600;
            vertical-align: middle;
        }

        .re-repeat-customer {
            display: inline-block;
            background: #3b82f6;
            color: #fff;
            font-size: 13px;
            padding: 2px 8px;
            border-radius: 4px;
            margin-right: 6px;
            font-weight: 600;
            vertical-align: middle;
        }

        .re-overage-customer {
            display: inline-block;
            background: #dc2626;
            color: #fff;
            font-size: 13px;
            padding: 2px 8px;
            border-radius: 4px;
            margin-right: 6px;
            font-weight: 600;
            vertical-align: middle;
        }

        .re-restrict-appstore {
            display: inline-block;
            background: #dc2626;
            color: #fff;
            font-size: 13px;
            padding: 2px 8px;
            border-radius: 4px;
            margin-left: 6px;
            font-weight: 600;
            vertical-align: middle;
        }

        #re-expand-business-title {
            justify-content: flex-start;
            gap: 8px;
        }

        .re-expand-badges {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .re-expand-badges .re-overage-customer,
        .re-expand-badges .re-repeat-customer,
        .re-expand-badges .re-restrict-appstore {
            margin-right: 0;
            margin-left: 0;
        }

        .re-expand-badges .re-repeat-customer {
            cursor: pointer;
            transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .re-expand-badges .re-repeat-customer:hover {
            opacity: 0.85;
            transform: translateY(-1px);
        }

        .re-column-right {
            width: 240px;
            min-width: 200px;
            border-left: 1px solid rgba(107, 114, 128, 0.2);
        }

        .re-column-header {
            padding: 14px 16px;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            background: linear-gradient(135deg, rgba(107, 114, 128, 0.15) 0%, rgba(75, 85, 99, 0.1) 100%);
            border-bottom: 1px solid rgba(107, 114, 128, 0.15);
            white-space: nowrap;
            overflow: hidden;
        }

        .re-column-left .re-column-header {
            text-align: center;
            padding: 14px 8px;
        }

        .re-column-content {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
        }

        .re-column-left .re-column-content {
            padding: 12px 4px;
        }

        .re-column-content::-webkit-scrollbar {
            width: 6px;
        }

        .re-column-content::-webkit-scrollbar-track {
            background: rgba(107, 114, 128, 0.1);
            border-radius: 3px;
        }

        .re-column-content::-webkit-scrollbar-thumb {
            background: rgba(107, 114, 128, 0.3);
            border-radius: 3px;
        }

        .re-column-content::-webkit-scrollbar-thumb:hover {
            background: rgba(107, 114, 128, 0.5);
        }

        .re-nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .re-nav-item {
            padding: 12px 0;
            margin-bottom: 4px;
            border-radius: 8px;
            color: #4b5563;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .re-icon {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .re-nav-item:hover {
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
        }

        .re-nav-item.active {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(96, 165, 250, 0.15) 100%);
            color: #1d4ed8;
            font-weight: 500;
        }

        .re-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
        }

        .re-empty-icon {
            width: 48px;
            height: 48px;
            color: #9ca3af;
            margin-bottom: 16px;
        }

        .re-empty-text {
            font-size: 14px;
            color: #6b7280;
        }

        .re-history-search {
            position: relative;
            margin-bottom: 12px;
        }

        .re-history-search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            stroke: #9ca3af;
            pointer-events: none;
        }

        .re-history-search-input {
            width: 100%;
            padding: 10px 12px 10px 38px;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 8px;
            font-size: 13px;
            background: rgba(255, 255, 255, 0.6);
            color: #374151;
            outline: none;
        }

        .re-history-search-input:focus {
            border-color: #3b82f6;
            background: rgba(255, 255, 255, 0.9);
        }

        .re-history-search-input::placeholder {
            color: #9ca3af;
        }

        .re-history-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 4px;
        }

        .re-history-month-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .re-history-month-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            border: 1px solid rgba(107, 114, 128, 0.15);
            cursor: pointer;
        }

        .re-history-month-header:hover {
            background: rgba(255, 255, 255, 1);
            border-color: rgba(107, 114, 128, 0.25);
        }

        .re-history-month-toggle {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .re-history-month-toggle:hover {
            color: #374151;
        }

        .re-history-month-toggle-icon {
            width: 16px;
            height: 16px;
        }

        .re-history-month-title {
            font-size: 15px;
            font-weight: 600;
            color: #374151;
        }

        .re-history-month-count {
            font-size: 12px;
            font-weight: 400;
            color: #6b7280;
            background: rgba(107, 114, 128, 0.1);
            padding: 3px 8px;
            border-radius: 6px;
        }

        .re-history-month-export {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            color: #9ca3af;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
        }

        .re-history-month-export:hover {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
        }

        .re-history-month-export svg {
            width: 16px;
            height: 16px;
        }

        .re-history-month-delete {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            color: #9ca3af;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .re-history-month-delete:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }

        .re-history-month-delete svg {
            width: 16px;
            height: 16px;
        }

        .re-history-month-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .re-history-month-content.re-hidden {
            display: none;
        }

        .re-history-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
        }

        .re-history-no-result {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }

        .re-history-no-result .re-empty-text {
            color: #9ca3af;
        }

        .re-history-day-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .re-history-day-card {
            flex: 1;
            min-width: 200px;
            max-width: calc(33.33% - 8px);
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            border: 1px solid rgba(107, 114, 128, 0.15);
            overflow: hidden;
        }

        .re-history-day-header {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid rgba(107, 114, 128, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .re-history-day-title {
            flex-shrink: 0;
        }

        .re-history-day-count {
            font-size: 11px;
            font-weight: 400;
            color: #6b7280;
            background: rgba(107, 114, 128, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .re-history-day-actions {
            display: flex;
            gap: 4px;
            margin-left: auto;
        }

        .re-history-day-delete {
            width: 24px;
            height: 24px;
            border: none;
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .re-history-day-delete:hover {
            background: rgba(239, 68, 68, 0.2);
        }

        .re-history-day-delete svg {
            width: 14px;
            height: 14px;
        }

        .re-history-day-export {
            width: 24px;
            height: 24px;
            border: none;
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .re-history-day-export:hover {
            background: rgba(59, 130, 246, 0.2);
        }

        .re-history-day-export svg {
            width: 14px;
            height: 14px;
        }

        .re-history-day-more {
            width: 24px;
            height: 24px;
            border: none;
            background: rgba(107, 114, 128, 0.1);
            color: #6b7280;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .re-history-day-more:hover {
            background: rgba(107, 114, 128, 0.2);
            color: #374151;
        }

        .re-history-day-more svg {
            width: 14px;
            height: 14px;
        }

        .re-history-day-collapse {
            width: 24px;
            height: 24px;
            border: none;
            background: rgba(107, 114, 128, 0.1);
            color: #6b7280;
            border-radius: 4px;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
        }

        .re-history-day-collapse:hover {
            background: rgba(107, 114, 128, 0.2);
            color: #374151;
        }

        .re-history-day-collapse svg {
            width: 14px;
            height: 14px;
        }

        .re-history-day-content {
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .re-history-day-content.collapsed .re-history-item-hidden {
            display: none;
        }

        .re-history-day-content.collapsed .re-history-item:not(.re-history-item-hidden) {
            display: flex;
        }

        .re-history-day-content.expanded .re-history-item {
            display: flex;
        }

        .re-history-item {
            background: rgba(249, 250, 251, 0.8);
            border-radius: 8px;
            padding: 10px 12px;
            cursor: pointer;
            border: 1px solid transparent;
        }

        .re-history-item:hover {
            background: rgba(59, 130, 246, 0.08);
            border-color: rgba(59, 130, 246, 0.2);
        }

        .re-history-item-hidden {
            display: none;
        }

        .re-history-item-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .re-history-item-index {
            font-size: 11px;
            font-weight: 600;
            color: #9ca3af;
            min-width: 18px;
            text-align: center;
        }

        .re-history-item-name {
            font-size: 13px;
            font-weight: 500;
            color: #1f2937;
        }

        .re-history-item-model {
            font-size: 12px;
            color: #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
        }

        .re-history-item-shop {
            font-size: 12px;
            color: #6b7280;
            background: rgba(107, 114, 128, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
            margin-left: auto;
        }

        .re-history-item-delete {
            width: 20px;
            height: 20px;
            border: none;
            background: transparent;
            color: #9ca3af;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .re-history-item-delete:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }

        .re-history-item-delete svg {
            width: 12px;
            height: 12px;
        }

        .re-history-item-preview {
            display: none;
            margin-top: 8px;
            padding: 8px 10px;
            background: rgba(243, 244, 246, 0.8);
            border-radius: 6px;
            font-size: 11px;
            color: #4b5563;
            line-height: 1.5;
            word-break: break-all;
        }

        .re-history-item-preview.show {
            display: block;
        }

        .re-form-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .re-form-group {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            padding: 14px;
            border: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-form-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-analysis-container {
            display: flex;
            flex-direction: column;
            gap: 0;
            padding: 20px;
            height: 100%;
            overflow-y: auto;
        }

        .re-analysis-section {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .re-analysis-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .re-analysis-title {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
        }

        .re-analysis-badge {
            padding: 3px 10px;
            border-radius: 10px;
            background: rgba(59, 130, 246, 0.08);
            color: #3b82f6;
            font-size: 11px;
            font-weight: 500;
        }

        .re-chart-card {
            background: #fff;
            border-radius: 10px;
            padding: 16px;
            border: 1px solid rgba(107, 114, 128, 0.12);
            position: relative;
        }

        .re-chart-tooltip {
            position: absolute;
            background: rgba(31, 41, 55, 0.95);
            color: #fff;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 11px;
            pointer-events: none;
            z-index: 100;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transform: translateX(-50%);
        }

        .re-chart-tooltip::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid rgba(31, 41, 55, 0.95);
        }

        .re-analysis-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }

        .re-stat-card {
            background: #fff;
            border-radius: 8px;
            padding: 10px 12px;
            border: 1px solid rgba(107, 114, 128, 0.1);
            text-align: center;
        }

        .re-stat-card.re-stat-high {
            border-left: 3px solid #10b981;
        }

        .re-stat-card.re-stat-low {
            border-left: 3px solid #f59e0b;
        }

        .re-stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            line-height: 1.2;
        }

        .re-stat-label {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 2px;
        }

        .re-analysis-divider {
            height: 1px;
            background: rgba(107, 114, 128, 0.15);
            margin: 18px 0;
        }

        .re-model-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            padding: 10px 12px;
            background: #fff;
            border-radius: 8px;
            border: 1px solid rgba(107, 114, 128, 0.1);
        }

        .re-legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            color: #4b5563;
            cursor: pointer;
            padding: 3px 6px;
            border-radius: 4px;
        }

        .re-legend-item:hover {
            background: rgba(0, 0, 0, 0.04);
        }

        .re-legend-color {
            width: 10px;
            height: 10px;
            border-radius: 2px;
        }

        .re-modal-day-edit {
            width: 320px;
        }

        .re-day-edit-info {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #4b5563;
            margin-bottom: 10px;
        }

        .re-day-edit-info strong {
            color: #1f2937;
        }

        .re-day-edit-row {
            margin-bottom: 12px;
        }

        .re-day-edit-row label {
            font-size: 13px;
            color: #4b5563;
        }

        .re-day-edit-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }

        .re-day-edit-checkbox input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #f97316;
            cursor: pointer;
        }

        .re-day-edit-input {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid rgba(107, 114, 128, 0.25);
            border-radius: 6px;
            font-size: 13px;
            color: #1f2937;
            background: #fff;
            margin-top: 6px;
            outline: none;
        }

        .re-day-edit-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }

        .re-settings-container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .re-settings-tabs {
            display: flex;
            gap: 4px;
            padding: 4px;
            background: rgba(107, 114, 128, 0.06);
            border-radius: 10px;
            margin-bottom: 16px;
        }

        .re-settings-tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 16px;
            font-size: 13px;
            font-weight: 500;
            color: #6b7280;
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }

        .re-settings-tab svg {
            width: 16px;
            height: 16px;
            stroke: currentColor;
        }

        .re-settings-tab:hover {
            color: #374151;
            background: rgba(255, 255, 255, 0.5);
        }

        .re-settings-tab.active {
            color: #374151;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .re-settings-content {
            flex: 1;
            overflow-y: auto;
            padding-right: 4px;
        }

        .re-settings-panel {
            display: none;
        }

        .re-settings-panel.active {
            display: block;
        }

        .re-settings-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .re-setting-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px;
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(107, 114, 128, 0.08);
            border-radius: 10px;
        }

        .re-setting-card:hover {
            background: rgba(255, 255, 255, 0.9);
            border-color: rgba(107, 114, 128, 0.15);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .re-setting-icon {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            flex-shrink: 0;
        }

        .re-setting-icon svg {
            width: 18px;
            height: 18px;
            stroke-width: 2;
        }

        .re-setting-icon-blue {
            background: rgba(59, 130, 246, 0.1);
        }

        .re-setting-icon-blue svg {
            stroke: #3b82f6;
        }

        .re-setting-icon-green {
            background: rgba(34, 197, 94, 0.1);
        }

        .re-setting-icon-green svg {
            stroke: #22c55e;
        }

        .re-setting-icon-purple {
            background: rgba(168, 85, 247, 0.1);
        }

        .re-setting-icon-purple svg {
            stroke: #a855f7;
        }

        .re-setting-icon-orange {
            background: rgba(249, 115, 22, 0.1);
        }

        .re-setting-icon-orange svg {
            stroke: #f97316;
        }

        .re-setting-icon-cyan {
            background: rgba(6, 182, 212, 0.1);
        }

        .re-setting-icon-cyan svg {
            stroke: #06b6d4;
        }

        .re-setting-icon-red {
            background: rgba(239, 68, 68, 0.1);
        }

        .re-setting-icon-red svg {
            stroke: #ef4444;
        }

        .re-setting-icon-indigo {
            background: rgba(99, 102, 241, 0.1);
        }

        .re-setting-icon-indigo svg {
            stroke: #6366f1;
        }

        .re-setting-info {
            flex: 1;
            min-width: 0;
        }

        .re-setting-name {
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            display: block;
        }

        .re-setting-desc {
            font-size: 11px;
            color: #9ca3af;
            display: block;
            margin-top: 2px;
        }



        .re-switch-small {
            transform: scale(0.85);
            transform-origin: right center;
        }

        .re-appearance-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .re-appearance-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(107, 114, 128, 0.08);
            border-radius: 10px;
        }

        .re-appearance-header {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .re-appearance-title {
            font-size: 13px;
            font-weight: 500;
            color: #374151;
        }

        .re-appearance-desc {
            font-size: 11px;
            color: #9ca3af;
        }

        .re-appearance-control {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .re-appearance-preview {
            padding: 16px;
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(107, 114, 128, 0.08);
            border-radius: 10px;
        }

        .re-appearance-preview-title {
            font-size: 12px;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 12px;
            display: block;
        }

        .re-color-picker {
            width: 50px;
            height: 32px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
            padding: 2px;
            background: #fff;
        }

        .re-color-picker::-webkit-color-swatch-wrapper {
            padding: 2px;
        }

        .re-color-picker::-webkit-color-swatch {
            border: none;
            border-radius: 4px;
        }

        .re-file-upload-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 14px;
            font-size: 12px;
            color: #fff;
            background: #3b82f6;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }

        .re-file-upload-btn:hover {
            background: #2563eb;
        }

        .re-filename-text {
            font-size: 12px;
            color: #6b7280;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .re-range-slider {
            width: 140px;
            height: 6px;
            -webkit-appearance: none;
            appearance: none;
            background: #e5e7eb;
            border-radius: 3px;
            outline: none;
        }

        .re-range-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);

        }

        .re-range-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
        }

        .re-opacity-text {
            font-size: 13px;
            color: #374151;
            font-weight: 500;
            min-width: 40px;
        }

        .re-preview-card {
            width: 100%;
            height: 120px;
            border-radius: 10px;
            overflow: hidden;
            border: 2px solid #e5e7eb;
            position: relative;
        }

        .re-preview-inner {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #e8eaed 0%, #d1d5db 50%, #e5e7eb 100%);
            position: relative;
        }

        .re-btn-sm {
            padding: 6px 12px;
            font-size: 12px;
            color: #374151;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
        }

        .re-btn-sm:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
        }

        .re-repeat-order-fields {
            display: flex;
            flex-direction: column;
            gap: 3px;
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
            word-break: break-all;
        }

        .re-repeat-strong {
            color: #1f2937;
            font-weight: 600;
        }

        .re-repeat-serial {
            color: #dc2626;
            font-weight: 600;
        }

        .re-repeat-order-actions {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex-shrink: 0;
        }

        .re-btn-sm-primary {
            color: #fff !important;
            background: #3b82f6 !important;
            border-color: #3b82f6 !important;
        }

        .re-btn-sm-primary:hover {
            background: #2563eb !important;
            border-color: #2563eb !important;
        }

        .re-btn-danger {
            color: #dc2626 !important;
            background: #fef2f2 !important;
            border-color: #fca5a5 !important;
        }

        .re-btn-danger:hover {
            background: #fee2e2 !important;
            border-color: #ef4444 !important;
        }

        .re-form-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
        }

        .re-form-inline {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .re-form-work {
            gap: 8px;
        }

        .re-form-row {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .re-form-item-inline {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 38px;
        }

        .re-form-item-work {
            flex: 1;
            min-height: 38px;
        }

        .re-form-item-inline .re-form-label {
            margin: 0;
            white-space: nowrap;
        }

        .re-flow-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }

        .re-flow-grid-4 {
            grid-template-columns: repeat(4, 1fr);
        }

        .re-flow-grid-2 {
            grid-template-columns: repeat(2, 1fr);
        }

        .re-flow-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .re-flow-item-full {
            grid-column: 1 / -1;
        }

        .re-flow-item .re-form-label {
            margin: 0;
            white-space: nowrap;
            min-width: auto;
        }

        .re-flow-item .re-input {
            flex: 1;
            min-width: 60px;
        }

        .re-input {
            flex: 1;
            min-width: 60px;
            padding: 8px 12px;
            border: 1px solid rgba(107, 114, 128, 0.3);
            border-radius: 6px;
            font-size: 13px;
            color: #374151;
            background: rgba(255, 255, 255, 0.9);
            width: 100%;
        }

        .re-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .re-input[readonly] {
            background: rgba(107, 114, 128, 0.1);
            cursor: not-allowed;
        }

        .re-input-small {
            flex: 0 0 auto;
            width: 80px;
            min-width: 60px;
        }

        .re-input-mini {
            flex: 0 0 auto;
            width: 75px;
            min-width: 60px;
        }

        .re-select {
            flex: 1;
            min-width: 80px;
            padding: 8px 12px;
            border: 1px solid rgba(107, 114, 128, 0.3);
            border-radius: 6px;
            font-size: 13px;
            color: #374151;
            background: rgba(255, 255, 255, 0.9);
            cursor: pointer;
        }

        .re-select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .re-select-small {
            flex: 0 0 auto;
            width: 70px;
            min-width: 60px;
        }

        .re-old-device-select {
            width: auto;
            min-width: 110px;
        }

        .re-multi-select {
            position: relative;
            display: inline-block;
            min-width: 120px;
        }

        .re-multi-select-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            border: 1px solid rgba(107, 114, 128, 0.3);
            border-radius: 6px;
            font-size: 13px;
            color: #374151;
            background: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            gap: 8px;
        }

        .re-multi-select-header:hover {
            border-color: #3b82f6;
        }

        .re-multi-select.open .re-multi-select-header {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .re-multi-select-text {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .re-multi-select-arrow {
            width: 14px;
            height: 14px;
            color: #9ca3af;

            flex-shrink: 0;
        }

        .re-multi-select.open .re-multi-select-arrow {
            transform: rotate(180deg);
        }

        .re-multi-select-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            min-width: 160px;
            margin-top: 4px;
            padding: 6px 0;
            background: #fff;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: none;
        }

        .re-multi-select.open .re-multi-select-dropdown {
            display: block !important;
        }

        .re-multi-select-items {
            max-height: 150px;
            overflow-y: auto;
        }

        .re-multi-select-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            cursor: pointer;

        }

        .re-multi-select-item:hover {
            background: rgba(59, 130, 246, 0.08);
        }

        .re-multi-select-item input {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: #3b82f6;
        }

        .re-multi-select-item span {
            font-size: 13px;
            color: #374151;
        }

        .re-multi-select-manage {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-top: 1px solid rgba(107, 114, 128, 0.15);
            margin-top: 4px;
            cursor: pointer;
            color: #6b7280;
            font-size: 12px;
        }

        .re-multi-select-manage:hover {
            background: rgba(59, 130, 246, 0.08);
            color: #3b82f6;
        }

        .re-multi-select-manage svg {
            width: 14px;
            height: 14px;
        }

        #re-work-proof {
            min-width: 200px;
        }

        #re-work-proof .re-multi-select-dropdown {
            min-width: 240px;
        }

        #re-work-proof .re-multi-select-items {
            max-height: 250px;
        }

        #re-work-proof .re-multi-select-item {
            padding: 10px 14px;
        }

        .re-select-editable-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
        }

        .re-select-editable {
            flex: 1;
        }

        .re-select-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #fff;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: none;
            max-height: 200px;
            overflow-y: auto;
        }

        .re-select-dropdown.show {
            display: block;
        }

        .re-select-dropdown-item {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 13px;
            color: #374151;
        }

        .re-select-dropdown-item:hover {
            background: rgba(59, 130, 246, 0.1);
        }

        .re-select-dropdown-item.selected {
            background: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
        }

        .re-select-dropdown-item.custom {
            color: #6b7280;
        }

        .re-select-dropdown-item.custom::after {
            content: ' (自定义)';
            font-size: 11px;
            color: #9ca3af;
        }

        .re-select-dropdown-manage {
            padding: 8px 12px;
            border-top: 1px solid rgba(107, 114, 128, 0.15);
            cursor: pointer;
            font-size: 12px;
            color: #3b82f6;
            background: rgba(59, 130, 246, 0.05);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .re-select-dropdown-manage:hover {
            background: rgba(59, 130, 246, 0.1);
        }

        .re-select-dropdown-manage svg {
            width: 14px;
            height: 14px;
        }

        .re-select-manage-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2147483650;
            display: none;
        }

        .re-select-manage-modal.show {
            display: block;
        }

        .re-select-manage-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            min-width: 300px;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .re-select-manage-title {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-select-manage-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }

        .re-select-manage-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: rgba(249, 250, 251, 0.8);
            border-radius: 6px;
            font-size: 13px;
            cursor: grab;
        }

        .re-select-manage-item:active {
            cursor: grabbing;
        }

        .re-select-manage-item.dragging {
            opacity: 0.5;
            background: rgba(59, 130, 246, 0.15);
        }

        .re-select-manage-item.drag-over {
            border: 2px dashed #3b82f6;
        }

        .re-select-manage-item.custom {
            background: rgba(59, 130, 246, 0.08);
        }

        .re-select-manage-item-left {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }

        .re-select-manage-drag-handle {
            color: #9ca3af;
            cursor: grab;
            display: flex;
            align-items: center;
        }

        .re-select-manage-drag-handle:active {
            cursor: grabbing;
        }

        .re-select-manage-drag-handle svg {
            width: 14px;
            height: 14px;
        }

        .re-select-manage-item-text {
            color: #374151;
        }

        .re-select-manage-item-delete {
            width: 20px;
            height: 20px;
            border: none;
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .re-select-manage-item-delete:hover {
            background: rgba(239, 68, 68, 0.2);
        }

        .re-select-manage-item-delete svg {
            width: 12px;
            height: 12px;
        }

        .re-select-manage-add {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }

        .re-select-manage-add input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 6px;
            font-size: 13px;
        }

        .re-select-manage-add input:focus {
            outline: none;
            border-color: #3b82f6;
        }

        .re-select-manage-add-btn {
            padding: 8px 16px;
            background: #3b82f6;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
        }

        .re-select-manage-add-btn:hover {
            background: #2563eb;
        }

        .re-select-manage-footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-select-manage-close {
            padding: 8px 20px;
            background: rgba(107, 114, 128, 0.1);
            color: #374151;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
        }

        .re-select-manage-close:hover {
            background: rgba(107, 114, 128, 0.2);
        }

        .re-switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 22px;
            flex-shrink: 0;
        }

        .re-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .re-switch-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(107, 114, 128, 0.3);
            border-radius: 22px;
        }

        .re-switch-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .re-switch input:checked + .re-switch-slider {
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
        }

        .re-switch input:checked + .re-switch-slider:before {
            transform: translateX(18px);
        }

        .re-switch-content {
            display: none;
        }

        .re-switch-content.re-visible {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .re-card {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-card-title {
            font-size: 15px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 2px solid rgba(59, 130, 246, 0.3);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .re-member-amount {
            font-size: 11px;
            font-weight: 400;
            color: #6b7280;
        }

        .re-card-title-text {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .re-refresh-icon {
            width: 16px;
            height: 16px;
            cursor: pointer;
            color: #6b7280;
        }

        .re-refresh-icon:hover {
            color: #3b82f6;
        }

        @keyframes re-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .re-tooltip {
            position: fixed;
            background: rgba(239, 68, 68, 0.95);
            color: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 2147483648;
            pointer-events: none;
            opacity: 0;
            transform: translateY(5px);
            max-width: 280px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .re-tooltip.re-tooltip-visible {
            opacity: 1;
            transform: translateY(0);
        }

        .re-tooltip::before {
            content: '';
            position: absolute;
            top: -6px;
            left: 20px;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 6px solid rgba(239, 68, 68, 0.95);
        }

        .re-quick-actions {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .re-action-btn {
            padding: 10px 16px;
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
            color: #2563eb;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .re-btn-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .re-action-btn:hover {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(96, 165, 250, 0.15) 100%);
            border-color: rgba(59, 130, 246, 0.5);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .re-action-btn.disabled {
            background: linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%);
            border-color: rgba(156, 163, 175, 0.3);
            color: #9ca3af;
            cursor: not-allowed;
            opacity: 0.6;
        }

        .re-action-btn.disabled:hover {
            background: linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%);
            border-color: rgba(156, 163, 175, 0.3);
            transform: none;
            box-shadow: none;
        }

        .re-action-btn.processing {
            position: relative;
            border: none;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
        }

        .re-action-btn.processing::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 8px;
            padding: 1px;
            background: linear-gradient(90deg, #10b981, #34d399, #10b981);
            background-size: 200% 100%;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
        }

        .re-action-btn.completed {
            border: 1px solid #10b981 !important;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 100%) !important;
            color: #059669 !important;
        }

        .re-action-btn.completed:hover {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.15) 100%) !important;
            border-color: #10b981 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .re-collapsible-header {
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        }

        .re-title-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .re-edit-icon {
            width: 14px;
            height: 14px;
            color: #6b7280;
            cursor: pointer;
        }

        .re-edit-icon:hover {
            color: #2563eb;
        }

        .re-collapse-icon {
            width: 16px;
            height: 16px;
            color: #6b7280;
        }

        .re-collapsible-header.collapsed .re-collapse-icon {
            transform: rotate(-90deg);
        }

        .re-contact-info {
            margin-top: 12px;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            border: 1px solid rgba(107, 114, 128, 0.15);
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            overflow: hidden;
            max-height: 200px;
        }

        .re-contact-info.re-hidden {
            opacity: 0;
            max-height: 0;
            margin-top: 0;
            padding-top: 0;
            padding-bottom: 0;
            border: none;
        }

        .re-contact-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            flex: 1;
        }

        .re-contact-label {
            font-size: 11px;
            color: #6b7280;
        }

        .re-contact-value {
            font-size: 13px;
            font-weight: 500;
            color: #374151;
        }

        .re-phone-duration {
            font-size: 12px;
            color: #3b82f6;
            margin-left: 8px;
            font-weight: 500;
            display: flex;
            align-items: center;
        }

        .re-contact-actions {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 8px;
            width: 100%;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(107, 114, 128, 0.1);
        }

        .re-contact-btn {
            padding: 4px 14px;
            font-size: 11px;
            border: 1px solid rgba(107, 114, 128, 0.3);
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.9);
            color: #4b5563;
            cursor: pointer;
        }

        .re-contact-btn:hover {
            background: rgba(59, 130, 246, 0.1);
            border-color: #3b82f6;
            color: #3b82f6;
        }

        .re-contact-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .re-contact-value.re-phone-alert {
            color: #dc2626;
            font-weight: 700;
        }

        .re-iframe-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 2147483647;
            margin: 0;
            padding: 0;
        }

        .re-iframe-modal.show {
            display: block !important;
        }

        .re-iframe-modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            border-radius: 12px;
            width: 65%;
            height: 70%;
            min-width: 800px;
            min-height: 500px;
            max-width: 95vw;
            max-height: 95vh;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .re-iframe-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 16px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.15);
            background: #fafafa;
            height: 41px;
            box-sizing: border-box;
        }

        .re-iframe-modal-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
        }

        .re-iframe-modal-close {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }

        .re-iframe-modal-close:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }

        .re-iframe-modal-close svg {
            width: 16px;
            height: 16px;
        }

        .re-iframe-modal-body {
            width: 100%;
            height: calc(100% - 41px);
        }

        .re-iframe-modal-body iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .re-risk-preview {
            margin-top: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            border: 1px solid rgba(107, 114, 128, 0.15);
            overflow: hidden;
            max-height: 300px;
        }

        .re-risk-preview.re-hidden {
            opacity: 0;
            max-height: 0;
            margin-top: 0;
            padding-top: 0;
            padding-bottom: 0;
            border: none;
        }

        .re-risk-preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-risk-preview-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
        }

        .re-risk-copy-icon {
            width: 16px;
            height: 16px;
            color: #9ca3af;
            cursor: pointer;
            flex-shrink: 0;
        }

        .re-risk-copy-icon:hover {
            color: #3b82f6;
            transform: scale(1.1);
        }

        .re-risk-copy-icon:active {
            transform: scale(0.95);
        }

        .re-risk-preview-content {
            font-size: 12px;
            color: #4b5563;
            line-height: 1.6;
            max-height: calc(1.6em * 5);
            overflow: hidden;
            word-break: break-all;
            cursor: default;
            position: relative;
        }

        .re-risk-preview-content.has-more::after {
            content: '...';
            position: absolute;
            bottom: 0;
            right: 0;
            padding-left: 20px;
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.9) 30%);
        }

        .re-risk-preview-content.clickable {
            cursor: pointer;
        }

        .re-risk-preview-content.clickable:hover {
            color: #3b82f6;
        }

        .re-risk-reduction {
            font-size: 12px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed rgba(107, 114, 128, 0.2);
        }

        .re-risk-reduction.increase {
            color: #ef4444;
        }

        .re-risk-reduction.decrease {
            color: #22c55e;
        }

        .re-data-section {
            display: flex;
            gap: 16px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-data-section-3 .re-data-col {
            flex: 1;
            min-width: 0;
            border-right: 1px solid rgba(107, 114, 128, 0.15);
            padding-right: 16px;
        }

        .re-data-section-3 .re-data-col:first-child {
            flex: 0.8;
        }

        .re-data-section-3 .re-data-col:nth-child(2) {
            flex: 0.8;
        }

        .re-data-section-3 .re-data-col:last-child {
            flex: 1.4;
            border-right: none;
            padding-right: 0;
        }

        .re-data-section-3 .re-data-col:not(:first-child) {
            padding-left: 16px;
        }

        .re-data-left,
        .re-data-right {
            flex: 1;
            min-width: 0;
        }

        .re-data-left {
            border-right: 1px solid rgba(107, 114, 128, 0.15);
            padding-right: 16px;
        }

        .re-data-right {
            padding-left: 16px;
        }

        .re-data-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .re-data-form-row {
            display: flex;
            gap: 12px;
        }

        .re-data-form-row .re-data-form-inline {
            flex: 1;
        }

        .re-data-form-full {
            flex: 1;
            width: 100%;
        }

        .re-data-form-full .re-input {
            flex: 1;
        }

        .re-data-form-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .re-data-form-inline {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .re-data-form-inline .re-form-label {
            font-size: 13px;
            color: #6b7280;
            white-space: nowrap;
        }

        .re-data-form-inline .re-input,
        .re-data-form-inline .re-select {
            flex: 1;
            min-width: 0;
        }

        .re-price-input {
            flex: 0 0 auto;
            width: 100px;
        }

        .re-rent-expand-select {
            display: none;
        }

        .re-rent-expand-select.re-visible {
            display: block;
        }

        .re-expand-result-row {
            display: none;
        }

        .re-expand-result-row.re-visible {
            display: flex;
        }

        .re-expand-result-row .re-input {
            flex: 1;
            min-width: 0;
        }

        .re-preview-box {
            margin-top: 12px;
            padding: 12px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.05) 100%);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 8px;
            cursor: pointer;
        }

        .re-preview-box:hover {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(96, 165, 250, 0.08) 100%);
            border-color: rgba(59, 130, 246, 0.35);
        }

        .re-preview-box.empty {
            cursor: not-allowed;
            opacity: 0.7;
        }

        .re-preview-box.empty:hover {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.05) 100%);
            border-color: rgba(59, 130, 246, 0.2);
        }

        .re-preview-content {
            font-size: 13px;
            color: #374151;
            line-height: 1.6;
        }

        .re-preview-expand {
            display: inline;
            color: #2563eb;
            margin-left: 8px;
        }

        .re-preview-placeholder {
            color: #9ca3af;
            font-style: italic;
        }

        .re-data-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(107, 114, 128, 0.08);
        }

        .re-data-row:last-child {
            border-bottom: none;
        }

        .re-data-label {
            font-size: 13px;
            color: #6b7280;
        }

        .re-data-value {
            font-size: 13px;
            font-weight: 500;
            color: #374151;
        }

        .re-data-value.re-highlight {
            font-weight: 700;
            color: #1d4ed8;
            background: rgba(59, 130, 246, 0.15);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .re-value-success {
            color: #10b981;
        }

        .re-value-warning {
            color: #f59e0b;
        }

        .re-value-danger {
            color: #ef4444;
        }

        .re-clickable {
            cursor: pointer;
            text-decoration: underline;
            text-decoration-style: dotted;
        }

        .re-clickable:hover {
            opacity: 0.8;
        }

        .re-value-info {
            color: #3b82f6;
        }

        .re-value-primary {
            color: #2563eb;
            font-weight: 600;
        }

        .re-value-remark {
            color: #6b7280;
            cursor: default;
            word-break: break-all;
        }

        .re-value-remark.re-remark-truncated {
            cursor: pointer;
        }

        .re-value-remark.re-remark-truncated:hover {
            color: #2563eb;
        }

        .re-price-suggest {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 100;
            display: none;
            flex-direction: column;
            min-width: 160px;
            padding: 6px 0;
            background: #fff;
            border: 1px solid rgba(107, 114, 128, 0.15);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin-top: 2px;
        }

        .re-price-suggest.re-suggest-visible {
            display: flex;
        }

        .re-price-suggest-item {
            padding: 10px 16px;
            font-size: 14px;
            color: #374151;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .re-price-suggest-item:hover {
            background: rgba(59, 130, 246, 0.08);
            color: #2563eb;
        }

        .re-price-suggest-item:first-child {
            border-radius: 8px 8px 0 0;
        }

        .re-price-suggest-item:last-child {
            border-radius: 0 0 8px 8px;
        }

        .re-price-suggest-label {
            color: #9ca3af;
            font-size: 12px;
        }

        .re-price-suggest-item:hover .re-price-suggest-label {
            color: #60a5fa;
        }

        .re-price-diff {
            font-size: 12px;
            margin-left: 6px;
            font-weight: 500;
        }

        .re-price-diff-high {
            color: #ef4444;
        }

        .re-price-diff-low {
            color: #10b981;
        }

        .re-price-wrapper {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
        }

        .re-phone-cost-input,
        .re-guide-price-input {
            border: none !important;
            background: transparent !important;
            padding: 2px 4px !important;
            box-shadow: none !important;
        }

        .re-info-card {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 12px;
            border: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-info-card.re-card-collapsed {
            padding-bottom: 10px;
        }

        .re-info-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
        }

        .re-collapsible-header.collapsed {
            margin-bottom: 0;
        }

        .re-info-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .re-info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid rgba(107, 114, 128, 0.1);
        }

        .re-info-item:last-child {
            border-bottom: none;
        }

        .re-info-label {
            font-size: 12px;
            color: #6b7280;
        }

        .re-info-value {
            font-size: 12px;
            font-weight: 500;
            color: #374151;
        }

        .re-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2147483648;
            opacity: 0;
            visibility: hidden;
        }

        .re-modal-overlay.re-modal-visible {
            opacity: 1;
            visibility: visible;
        }

        .re-modal {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 16px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transform: scale(0.9);
        }

        .re-modal-overlay.re-modal-visible .re-modal {
            transform: scale(1);
        }

        .re-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-modal-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
        }

        .re-modal-close {
            width: 28px;
            height: 28px;
            border: none;
            background: rgba(107, 114, 128, 0.1);
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .re-modal-close:hover {
            background: rgba(107, 114, 128, 0.2);
        }

        .re-modal-close svg {
            width: 16px;
            height: 16px;
            stroke: #6b7280;
        }

        .re-modal-content {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.6;
        }

        .re-modal-body {
            padding: 16px;
        }

        .re-modal-edit {
            max-width: 500px;
        }

        .re-modal-confirm {
            max-width: 360px;
        }

        #re-confirm-content {
            text-align: center;
            padding: 20px 0;
            font-size: 14px;
            color: #374151;
        }

        .re-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding-top: 16px;
            margin-top: 16px;
            border-top: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            border: 1px solid transparent;
        }

        .re-btn-primary {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
        }

        .re-btn-primary:hover {
            background: #1d4ed8;
        }

        .re-btn-default {
            background: rgba(255, 255, 255, 0.9);
            color: #374151;
            border-color: rgba(107, 114, 128, 0.25);
        }

        .re-btn-default:hover {
            background: white;
            border-color: rgba(107, 114, 128, 0.35);
        }

        .re-btn-icon-small {
            width: 14px;
            height: 14px;
        }

        .re-modal-model-orders {
            max-width: 600px;
            max-height: 70vh;
        }

        .re-model-orders-list {
            max-height: 50vh;
            overflow-y: auto;
        }

        .re-model-order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: rgba(107, 114, 128, 0.03);
            border-radius: 8px;
            margin-bottom: 8px;
            border: 1px solid rgba(107, 114, 128, 0.1);
        }

        .re-model-order-item:hover {
            background: rgba(107, 114, 128, 0.06);
            border-color: rgba(107, 114, 128, 0.15);
        }

        .re-model-order-item:last-child {
            margin-bottom: 0;
        }

        .re-model-order-info {
            flex: 1;
            min-width: 0;
        }

        .re-model-order-name {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .re-model-order-detail {
            font-size: 12px;
            color: #6b7280;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .re-model-order-detail span {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .re-model-order-date {
            font-size: 11px;
            color: #9ca3af;
            text-align: right;
            flex-shrink: 0;
        }

        .re-model-order-empty {
            text-align: center;
            padding: 40px 20px;
            color: #9ca3af;
        }

        .re-modal-day-edit {
            max-width: 360px;
        }

        .re-day-edit-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(107, 114, 128, 0.1);
        }

        .re-day-edit-info:last-of-type {
            margin-bottom: 16px;
        }

        .re-day-edit-info span {
            color: #6b7280;
            font-size: 13px;
        }

        .re-day-edit-info strong {
            color: #1f2937;
            font-size: 14px;
        }

        .re-day-edit-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .re-day-edit-row label {
            font-size: 13px;
            color: #374151;
            flex-shrink: 0;
        }

        .re-day-edit-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }

        .re-day-edit-checkbox input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .re-day-edit-checkbox span {
            font-size: 13px;
            color: #374151;
        }

        .re-day-edit-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid rgba(107, 114, 128, 0.25);
            border-radius: 6px;
            font-size: 13px;
            outline: none;
        }

        .re-day-edit-input:focus {
            border-color: #3b82f6;
        }

        .re-modal-order-detail {
            max-width: 500px;
        }

        .re-order-detail-content {
            font-size: 13px;
            line-height: 1.8;
            color: #374151;
            white-space: pre-wrap;
            word-break: break-all;
        }

        .re-model-order-item {
            cursor: pointer;
        }

        .re-model-order-item:hover .re-model-order-name {
            color: #2563eb;
        }

        .re-action-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            padding-top: 12px;
            margin-top: 12px;
            border-top: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 12px;
            border: 1px solid rgba(107, 114, 128, 0.25);
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            background: rgba(255, 255, 255, 0.7);
            color: #4b5563;
        }

        .re-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            background: rgba(255, 255, 255, 0.9);
            border-color: rgba(107, 114, 128, 0.35);
        }

        .re-action-btn:active {
            transform: translateY(0);
        }

        .re-btn-icon {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            stroke: #6b7280;
        }

        .re-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            z-index: 2147483646;
            backdrop-filter: blur(2px);
        }

        #re-system-panel.re-low-perf::before,
        #re-system-panel.re-low-perf::after {
            display: none;
        }

        #re-system-panel.re-low-perf .re-column {
            backdrop-filter: none;
            background: rgba(255, 255, 255, 0.92);
        }

        #re-system-panel.re-low-perf .re-overlay {
            backdrop-filter: none;
            background: rgba(0, 0, 0, 0.5);
        }

        #re-system-panel.re-low-perf .re-modal-overlay {
            backdrop-filter: none;
            background: rgba(0, 0, 0, 0.5);
        }

        #re-system-panel.re-low-perf .re-panel-content {
            background: rgba(248, 250, 252, 0.95);
        }

        /* 风险面板样式 - 吸附在主面板右侧 */
        .re-risk-panel {
            position: absolute;
            top: 0;
            right: -290px;
            width: 280px;
            height: 100%;
            background: linear-gradient(135deg, #e8eaed 0%, #d1d5db 50%, #e5e7eb 100%);
            border-radius: 16px;
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
            z-index: 15;
            opacity: 0;
            visibility: hidden;
            transform: translateX(-10px);
            display: flex;
            flex-direction: column;
            border-left: 1px solid rgba(107, 114, 128, 0.2);
        }

        .re-risk-panel.re-risk-visible {
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
        }

        .re-risk-panel-header {
            padding: 10px 16px;
            background: linear-gradient(135deg, rgba(107, 114, 128, 0.95) 0%, rgba(75, 85, 99, 0.95) 100%);
            border-radius: 16px 16px 0 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .re-risk-panel-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #ffffff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .re-risk-panel-title svg {
            width: 18px;
            height: 18px;
            color: #fca5a5;
        }

        .re-risk-count {
            font-size: 12px;
            color: #fca5a5;
            font-weight: 600;
        }

        .re-risk-panel-close {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.7);
        }

        .re-risk-panel-close:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
        }

        .re-risk-panel-close svg {
            width: 16px;
            height: 16px;
        }

        .re-risk-panel-content {
            padding: 12px;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-radius: 0 0 16px 16px;
        }

        .re-risk-panel-content::-webkit-scrollbar {
            width: 4px;
        }

        .re-risk-panel-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .re-risk-panel-content::-webkit-scrollbar-thumb {
            background: rgba(107, 114, 128, 0.2);
            border-radius: 2px;
        }

        .re-risk-item {
            padding: 10px 12px;
            background: rgba(243, 244, 246, 0.5);
            border-radius: 8px;
        }

        .re-risk-item:hover {
            background: rgba(243, 244, 246, 0.8);
        }

        .re-risk-item-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .re-risk-item-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .re-risk-item.re-risk-high .re-risk-item-dot {
            background: #ef4444;
        }

        .re-risk-item.re-risk-medium .re-risk-item-dot {
            background: #f59e0b;
        }

        .re-risk-item.re-risk-normal .re-risk-item-dot {
            background: #10b981;
        }

        .re-risk-item-title {
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            flex: 1;
        }

        .re-risk-item-badge {
            font-size: 12px;
            font-weight: 500;
            padding: 1px 8px;
            border-radius: 4px;
        }

        .re-risk-item.re-risk-high .re-risk-item-badge {
            background: rgba(239, 68, 68, 0.12);
            color: #ef4444;
        }

        .re-risk-item.re-risk-medium .re-risk-item-badge {
            background: rgba(245, 158, 11, 0.12);
            color: #f59e0b;
        }

        .re-risk-item.re-risk-normal .re-risk-item-badge {
            background: rgba(16, 185, 129, 0.12);
            color: #10b981;
        }

        .re-risk-item-detail {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 4px;
            padding-left: 15px;
            line-height: 1.4;
        }

        .re-risk-item-detail span {
            font-weight: 500;
        }

        .re-risk-item.re-risk-high .re-risk-item-detail span {
            color: #ef4444;
        }

        .re-risk-item.re-risk-medium .re-risk-item-detail span {
            color: #f59e0b;
        }

        .re-risk-item.re-risk-normal .re-risk-item-detail span {
            color: #10b981;
        }

        .re-risk-empty span {
            font-size: 13px;
            color: #6b7280;
            margin-top: 6px;
        }

        /* 无锁判断面板样式 */
        .re-no-lock-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 360px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
            border: 1px solid rgba(0, 0, 0, 0.1);
            z-index: 2147483646;
            opacity: 0;
            visibility: hidden;
            transform: translateX(100%);
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            backface-visibility: hidden;
        }

        .re-no-lock-panel.re-no-lock-visible {
            opacity: 1;
            visibility: visible;
            transform: translateX(0) translateZ(0);
        }

        .re-no-lock-header {
            padding: 14px 18px;
            background: linear-gradient(135deg, rgba(107, 114, 128, 0.95) 0%, rgba(75, 85, 99, 0.95) 100%);
            border-radius: 16px 16px 0 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            cursor: move;
            user-select: none;
        }

        .re-no-lock-title {
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .re-no-lock-status {
            font-size: 13px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: 20px;
            transition: all 0.3s ease;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            letter-spacing: 0.5px;
            backdrop-filter: blur(8px);
        }

        .re-no-lock-status.satisfied {
            color: #ffffff;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: pulse-green 2s ease-in-out infinite;
        }

        .re-no-lock-status.unsatisfied {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.15);
            color: #ffffff;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: pulse-red 2s ease-in-out infinite;
        }

        .re-no-lock-status.pending {
            color: rgba(255, 255, 255, 0.85);
            background: rgba(255, 255, 255, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        @keyframes pulse-green {
            0%, 100% {
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% {
                box-shadow: 0 2px 12px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(16, 185, 129, 0);
            }
        }

        @keyframes pulse-red {
            0%, 100% {
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4), 0 0 0 0 rgba(239, 68, 68, 0.7);
            }
            50% {
                box-shadow: 0 2px 12px rgba(239, 68, 68, 0.6), 0 0 0 4px rgba(239, 68, 68, 0);
            }
        }

        .re-no-lock-close {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;
        }

        .re-no-lock-close:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
        }

        .re-no-lock-close svg {
            width: 16px;
            height: 16px;
        }

        .re-no-lock-content {
            padding: 16px 18px;
            background: rgba(248, 250, 252, 0.5);
        }

        .re-no-lock-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 12px;
            margin-bottom: 12px;
        }

        .re-no-lock-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .re-no-lock-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
        }

        .re-no-lock-label {
            font-size: 13px;
            color: #6b7280;
            font-weight: 500;
        }

        .re-no-lock-value {
            font-size: 13px;
            color: #374151;
            font-weight: 600;
        }

        .re-no-lock-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(107, 114, 128, 0.2), transparent);
            margin: 8px 0;
        }

        .re-no-lock-editable {
            gap: 8px;
        }

        .re-no-lock-input {
            flex: 1;
            height: 32px;
            padding: 0 10px;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 6px;
            font-size: 13px;
            color: #374151;
            background: #ffffff;
            transition: all 0.2s ease;
        }

        .re-no-lock-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .re-no-lock-input::placeholder {
            color: #9ca3af;
        }

        .re-no-lock-recalc {
            height: 32px;
            padding: 0 14px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            color: #ffffff;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .re-no-lock-recalc:hover {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
            transform: translateY(-1px);
        }

        .re-no-lock-recalc:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .re-no-lock-preview {
            margin-top: 12px;
        }

        .re-no-lock-preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
        }

        .re-no-lock-preview-title {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
        }

        .re-no-lock-preview-actions {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .re-no-lock-action-btn {
            width: 28px;
            height: 28px;
            padding: 5px;
            border: none;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .re-no-lock-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .re-no-lock-action-btn:active {
            transform: translateY(0);
        }

        .re-no-lock-action-btn svg {
            width: 14px;
            height: 14px;
        }

        .re-no-lock-copy-btn {
            width: 24px;
            height: 24px;
            padding: 4px;
            border: none;
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            transition: all 0.2s ease;
        }

        .re-no-lock-copy-btn:hover {
            background: rgba(107, 114, 128, 0.1);
            color: #374151;
        }

        .re-no-lock-copy-btn:active {
            background: rgba(107, 114, 128, 0.2);
        }

        .re-no-lock-copy-btn svg {
            width: 14px;
            height: 14px;
        }

        .re-no-lock-preview-text {
            width: 100%;
            min-height: 60px;
            padding: 8px 10px;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 6px;
            font-size: 12px;
            color: #374151;
            background: #ffffff;
            resize: vertical;
            font-family: inherit;
            line-height: 1.5;
        }

        .re-no-lock-preview-text:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .re-risk-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #6b7280;
            gap: 10px;
        }

        .re-risk-empty svg {
            width: 32px;
            height: 32px;
            color: #10b981;
        }

        .re-risk-empty span {
            font-size: 13px;
        }

        #re-system-panel.re-low-perf .re-risk-panel {
            background: rgba(255, 255, 255, 0.95);
        }
    `;

    GM_addStyle(styles.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, 'font-size: calc($1px * var(--re-fs-scale, 1))'));

    document.body.insertAdjacentHTML('beforeend', panelHTML);

    const panel = document.getElementById('re-system-panel');
    const header = panel.querySelector('.re-panel-header');
    const resizeHandle = panel.querySelector('.re-panel-resize-handle');

    const staffNameInputModal = document.createElement('div');
    staffNameInputModal.id = 're-staff-input-modal';
    staffNameInputModal.className = 're-modal-overlay';
    staffNameInputModal.innerHTML = `
        <div class="re-modal" style="width: 320px;">
            <div class="re-modal-header">
                <span class="re-modal-title">请输入客服姓名</span>
            </div>
            <div class="re-modal-body" style="padding: 20px;">
                <input type="text" class="re-input" id="re-staff-input" placeholder="请输入客服姓名" style="width: 100%; margin-bottom: 16px;">
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="re-contact-btn" id="re-staff-cancel">取消</button>
                    <button class="re-contact-btn" id="re-staff-confirm" style="background: #3b82f6; color: #fff; border-color: #3b82f6;">确定</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(staffNameInputModal);

    let staffDb = null;
    let cachedStaffName = '';
    const STAFF_DB_NAME = 'ReSystemDB';
    const STAFF_STORE_NAME = 'settings';
    const STAFF_KEY = 'staffName';

    function openStaffDB() {
        return new Promise((resolve, reject) => {
            if (staffDb) {
                resolve(staffDb);
                return;
            }
            const request = indexedDB.open(STAFF_DB_NAME, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                staffDb = request.result;
                resolve(staffDb);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STAFF_STORE_NAME)) {
                    db.createObjectStore(STAFF_STORE_NAME);
                }
            };
        });
    }

    function getStaffName() {
        return new Promise((resolve, reject) => {
            openStaffDB().then(db => {
                const transaction = db.transaction(STAFF_STORE_NAME, 'readonly');
                const store = transaction.objectStore(STAFF_STORE_NAME);
                const request = store.get(STAFF_KEY);
                request.onsuccess = () => resolve(request.result || '');
                request.onerror = () => reject(request.error);
            }).catch(reject);
        });
    }

    function setStaffName(name) {
        return new Promise((resolve, reject) => {
            openStaffDB().then(db => {
                const transaction = db.transaction(STAFF_STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STAFF_STORE_NAME);
                const request = store.put(name, STAFF_KEY);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }).catch(reject);
        });
    }

    const HISTORY_DB_NAME = 'ReSystemHistoryDB';
    const HISTORY_STORE_NAME = 'history';
    let historyDb = null;

    function openHistoryDB() {
        return new Promise((resolve, reject) => {
            if (historyDb) {
                resolve(historyDb);
                return;
            }
            const request = indexedDB.open(HISTORY_DB_NAME, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                historyDb = request.result;
                resolve(historyDb);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
                    const store = db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('nameDate', ['name', 'date'], { unique: false });
                }
            };
        });
    }

    function saveHistoryRecord(record) {
        return new Promise((resolve, reject) => {
            openHistoryDB().then(db => {
                const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
                const store = transaction.objectStore(HISTORY_STORE_NAME);

                const getAllRequest = store.getAll();
                getAllRequest.onsuccess = function() {
                    const records = getAllRequest.result;
                    const existingRecord = records.find(r =>
                        r.name === record.name && r.shop === record.shop
                    );

                    if (existingRecord) {
                        record.id = existingRecord.id;
                        record.date = existingRecord.date;
                        const putRequest = store.put(record);
                        putRequest.onsuccess = () => resolve();
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        const addRequest = store.add(record);
                        addRequest.onsuccess = () => resolve();
                        addRequest.onerror = () => reject(addRequest.error);
                    }
                };
                getAllRequest.onerror = () => reject(getAllRequest.error);
            }).catch(reject);
        });
    }

    function deleteHistoryRecord(id) {
        return new Promise((resolve, reject) => {
            openHistoryDB().then(db => {
                const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
                const store = transaction.objectStore(HISTORY_STORE_NAME);
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }).catch(reject);
        });
    }

    function deleteHistoryRecordsByDate(date) {
        return new Promise((resolve, reject) => {
            getAllHistoryRecords().then(records => {
                const idsToDelete = records.filter(r => r.date === date).map(r => r.id);
                if (idsToDelete.length === 0) {
                    resolve();
                    return;
                }
                openHistoryDB().then(db => {
                    const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
                    const store = transaction.objectStore(HISTORY_STORE_NAME);
                    let completed = 0;
                    idsToDelete.forEach(id => {
                        const request = store.delete(id);
                        request.onsuccess = () => {
                            completed++;
                            if (completed === idsToDelete.length) {
                                resolve();
                            }
                        };
                        request.onerror = () => reject(request.error);
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    function deleteHistoryRecordsByMonth(month) {
        return new Promise((resolve, reject) => {
            getAllHistoryRecords().then(records => {
                const idsToDelete = records.filter(r => r.date && r.date.startsWith(month)).map(r => r.id);
                if (idsToDelete.length === 0) {
                    resolve();
                    return;
                }
                openHistoryDB().then(db => {
                    const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
                    const store = transaction.objectStore(HISTORY_STORE_NAME);
                    let completed = 0;
                    idsToDelete.forEach(id => {
                        const request = store.delete(id);
                        request.onsuccess = () => {
                            completed++;
                            if (completed === idsToDelete.length) {
                                resolve();
                            }
                        };
                        request.onerror = () => reject(request.error);
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    function getAllHistoryRecords() {
        return new Promise((resolve, reject) => {
            openHistoryDB().then(db => {
                const transaction = db.transaction(HISTORY_STORE_NAME, 'readonly');
                const store = transaction.objectStore(HISTORY_STORE_NAME);
                const request = store.getAll();
                request.onsuccess = () => {
                    const records = request.result || [];
                    resolve(records);
                };
                request.onerror = () => reject(request.error);
            }).catch(reject);
        });
    }

    function exportToExcel(date, records, staffName) {
        const dateObj = new Date(date);
        const dateStr = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}`;
        const fileName = `${staffName}_${dateStr}.xlsx`;

        const headers = ['序号', '姓名', '机型', '店铺', '风控预览', '时间'];
        const rows = records.map((r, idx) => [
            idx + 1,
            r.name || '',
            r.model || '',
            r.shop || '',
            r.preview || '',
            r.time || ''
        ]);

        let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        tableHtml += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
        tableHtml += '<x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
        tableHtml += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">';
        tableHtml += '<tr>' + headers.map(h => `<th style="background:#3b82f6;color:#fff;font-weight:bold;padding:8px;">${h}</th>`).join('') + '</tr>';
        rows.forEach(row => {
            tableHtml += '<tr>' + row.map(cell => `<td style="padding:6px;border:1px solid #ddd;">${String(cell).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('') + '</tr>';
        });
        tableHtml += '</table></body></html>';

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function exportMonthToExcel(month, records, staffName) {
        const monthObj = new Date(month + '-01');
        const monthStr = `${monthObj.getFullYear()}${String(monthObj.getMonth() + 1).padStart(2, '0')}`;
        const fileName = `${staffName}_${monthStr}.xlsx`;

        const headers = ['序号', '姓名', '机型', '店铺', '风控预览', '日期', '时间'];
        const rows = records.map((r, idx) => [
            idx + 1,
            r.name || '',
            r.model || '',
            r.shop || '',
            r.preview || '',
            r.date || '',
            r.time || ''
        ]);

        let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        tableHtml += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
        tableHtml += '<x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
        tableHtml += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">';
        tableHtml += '<tr>' + headers.map(h => `<th style="background:#3b82f6;color:#fff;font-weight:bold;padding:8px;">${h}</th>`).join('') + '</tr>';
        rows.forEach(row => {
            tableHtml += '<tr>' + row.map(cell => `<td style="padding:6px;border:1px solid #ddd;">${String(cell).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('') + '</tr>';
        });
        tableHtml += '</table></body></html>';

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    const MODEL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    function renderAnalysisData() {
        const monthLabel = document.getElementById('re-analysis-month-label');
        const today = new Date();
        if (monthLabel) {
            monthLabel.textContent = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}`;
        }

        getAllHistoryRecords().then(records => {
            const dailyData = {};
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const startDate = new Date(currentYear, currentMonth, 1);
            const currentDay = today.getDate();

            for (let i = 0; i < currentDay; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dateStr = formatDateForAnalysis(date);
                dailyData[dateStr] = 0;
            }

            records.forEach(record => {
                if (record.date && dailyData.hasOwnProperty(record.date)) {
                    dailyData[record.date]++;
                }
            });

            const sortedDates = Object.keys(dailyData).sort();
            const editedDays = getEditedDays();
            const chartData = sortedDates.map(date => {
                const originalCount = dailyData[date];
                const editedCount = editedDays[date];
                return {
                    date: date,
                    count: editedCount !== undefined ? editedCount : originalCount,
                    originalCount: originalCount,
                    isEdited: editedCount !== undefined
                };
            });

            drawOrderChart(chartData);
            updateAnalysisStats(chartData);
        });
    }

    function formatDateForAnalysis(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getRestDays() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE.restDaysKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    function saveRestDays(days) {
        try {
            localStorage.setItem(CONFIG.STORAGE.restDaysKey, JSON.stringify(days));
        } catch (e) {}
    }

    function toggleRestDay(date) {
        const restDays = getRestDays();
        const index = restDays.indexOf(date);
        if (index > -1) {
            restDays.splice(index, 1);
        } else {
            restDays.push(date);
        }
        saveRestDays(restDays);
        return index === -1;
    }

    function getEditedDays() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE.editedDaysKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }

    function saveEditedDays(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE.editedDaysKey, JSON.stringify(data));
        } catch (e) {}
    }

    function setEditedCount(date, count) {
        const editedDays = getEditedDays();
        if (count === null || count === undefined) {
            delete editedDays[date];
        } else {
            editedDays[date] = count;
        }
        saveEditedDays(editedDays);
    }

    function drawOrderChart(data) {
        const canvas = document.getElementById('re-order-chart');
        const tooltip = document.getElementById('re-chart-tooltip');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const canvasW = rect.width - 32;
        const canvasH = 220;

        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        canvas.style.width = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 16, bottom: 36, left: 40 };
        const chartW = canvasW - padding.left - padding.right;
        const chartH = canvasH - padding.top - padding.bottom;

        if (data.length === 0) {
            ctx.clearRect(0, 0, canvasW, canvasH);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvasW / 2, canvasH / 2);
            canvas.chartPoints = [];
            return;
        }

        const maxCount = Math.max(...data.map(d => d.count), 1);
        const yScale = chartH / (maxCount + 1);
        const xStep = chartW / (data.length - 1 || 1);
        const yGridCount = 4;
        const restDays = getRestDays();
        const chartPoints = [];

        // 从左到右绘制动画
        const animDuration = 800;
        const animStart = performance.now();

        function drawGrid() {
            ctx.strokeStyle = 'rgba(107, 114, 128, 0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= yGridCount; i++) {
                const y = padding.top + (chartH / yGridCount) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(canvasW - padding.right, y);
                ctx.stroke();
                const value = Math.round(maxCount - (maxCount / yGridCount) * i);
                ctx.fillStyle = '#9ca3af';
                ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(value.toString(), padding.left - 6, y);
            }
        }

        function drawXLabels() {
            ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const step = Math.max(1, Math.ceil(data.length / 8));
            data.forEach((d, i) => {
                if (i % step === 0 || i === data.length - 1) {
                    const x = padding.left + i * xStep;
                    const parts = d.date.split('-');
                    ctx.fillStyle = restDays.includes(d.date) ? '#f97316' : '#9ca3af';
                    ctx.fillText(`${parts[1]}-${parts[2]}`, x, canvasH - padding.bottom + 8);
                }
            });
        }

        function animate(now) {
            const elapsed = now - animStart;
            const progress = Math.min(elapsed / animDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const drawCount = Math.ceil(data.length * eased);

            ctx.clearRect(0, 0, canvasW, canvasH);
            drawGrid();

            // 折线
            if (drawCount > 0) {
                ctx.beginPath();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                for (let i = 0; i < drawCount; i++) {
                    const x = padding.left + i * xStep;
                    const y = padding.top + chartH - data[i].count * yScale;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // 数据点
                chartPoints.length = 0;
                for (let i = 0; i < drawCount; i++) {
                    const d = data[i];
                    const x = padding.left + i * xStep;
                    const y = padding.top + chartH - d.count * yScale;
                    const isRestDay = restDays.includes(d.date);
                    const isEdited = d.isEdited;

                    chartPoints.push({ x, y, date: d.date, count: d.count, originalCount: d.originalCount, isRestDay, isEdited });

                    ctx.beginPath();
                    let pointColor = '#fff', pointStroke = '#3b82f6', pointSize = 3;
                    if (isRestDay) { pointColor = '#f97316'; pointStroke = '#ea580c'; pointSize = 5; }
                    else if (isEdited) { pointColor = '#10b981'; pointStroke = '#059669'; pointSize = 4; }

                    ctx.arc(x, y, pointSize, 0, Math.PI * 2);
                    ctx.fillStyle = pointColor;
                    ctx.fill();
                    ctx.strokeStyle = pointStroke;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    if (isRestDay) {
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 7px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('休', x, y);
                    }
                }
            }

            drawXLabels();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                canvas.chartPoints = chartPoints;
                canvas.chartPadding = padding;
                bindChartEvents(canvas, tooltip, chartPoints, padding, canvasH);
            }
        }
        requestAnimationFrame(animate);
    }

    function bindChartEvents(canvas, tooltip, chartPoints, padding, height) {
        if (!tooltip) return;

        canvas.onmousemove = function(e) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            let found = null;
            for (const p of chartPoints) {
                if (Math.sqrt(Math.pow(mouseX - p.x, 2) + Math.pow(mouseY - p.y, 2)) <= 12) {
                    found = p;
                    break;
                }
            }
            if (found) {
                let statusLabel = '';
                if (found.isRestDay) {
                    statusLabel = '<br/><span style="color:#f97316;">[休息日]</span>';
                } else if (found.isEdited) {
                    statusLabel = `<br/><span style="color:#10b981;">[已编辑 原始: ${found.originalCount}台]</span>`;
                } else {
                    statusLabel = '<br/><span style="color:#9ca3af;font-size:11px;">点击编辑</span>';
                }
                tooltip.innerHTML = `<strong>${found.date}</strong><br/>订单：${found.count}${statusLabel}`;
                tooltip.style.display = 'block';
                tooltip.style.left = found.x + 'px';
                tooltip.style.top = (found.y - 40) + 'px';
            } else {
                tooltip.style.display = 'none';
            }
        };

        canvas.onmouseleave = function() {
            tooltip.style.display = 'none';
        };

        canvas.onclick = function(e) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            let found = null;
            for (const p of chartPoints) {
                if (Math.sqrt(Math.pow(mouseX - p.x, 2) + Math.pow(mouseY - p.y, 2)) <= 12) {
                    found = p;
                    break;
                }
            }
            if (found) {
                showDayEditModal(found);
            }
        };
    }

    function showDayEditModal(point) {
        let modal = document.getElementById('re-day-edit-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 're-day-edit-modal';
            modal.className = 're-modal-overlay';
            modal.innerHTML = `
                <div class="re-modal re-modal-day-edit">
                    <div class="re-modal-header">
                        <span class="re-modal-title" id="re-day-edit-title">编辑日期</span>
                        <button class="re-modal-close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div class="re-modal-content">
                        <div class="re-day-edit-info">
                            <span>日期：</span><strong id="re-day-edit-date"></strong>
                        </div>
                        <div class="re-day-edit-info">
                            <span>原始台数：</span><span id="re-day-edit-original"></span>
                        </div>
                        <div class="re-day-edit-row">
                            <label class="re-day-edit-checkbox">
                                <input type="checkbox" id="re-day-edit-rest">
                                <span>标记为休息日</span>
                            </label>
                        </div>
                        <div class="re-day-edit-row">
                            <label>编辑台数：</label>
                            <input type="number" class="re-day-edit-input" id="re-day-edit-count" min="0" placeholder="留空则使用原始数据">
                        </div>
                    </div>
                    <div class="re-modal-footer">
                        <button class="re-btn re-btn-default" id="re-day-edit-reset">重置</button>
                        <button class="re-btn re-btn-primary" id="re-day-edit-save">保存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.re-modal-close').addEventListener('click', () => {
                modal.classList.remove('re-modal-visible');
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('re-modal-visible');
                }
            });
        }

        const dateEl = modal.querySelector('#re-day-edit-date');
        const originalEl = modal.querySelector('#re-day-edit-original');
        const restCheckbox = modal.querySelector('#re-day-edit-rest');
        const countInput = modal.querySelector('#re-day-edit-count');
        const resetBtn = modal.querySelector('#re-day-edit-reset');
        const saveBtn = modal.querySelector('#re-day-edit-save');

        if (dateEl) dateEl.textContent = point.date;
        if (originalEl) originalEl.textContent = point.originalCount;
        if (restCheckbox) restCheckbox.checked = point.isRestDay;
        if (countInput) {
            countInput.value = point.isEdited ? point.count : '';
            countInput.placeholder = `原始数据: ${point.originalCount}`;
        }

        const saveHandler = () => {
            const isRest = restCheckbox ? restCheckbox.checked : false;
            const newCount = countInput ? countInput.value : '';

            const restDays = getRestDays();
            const restIndex = restDays.indexOf(point.date);

            if (isRest && restIndex === -1) {
                restDays.push(point.date);
            } else if (!isRest && restIndex > -1) {
                restDays.splice(restIndex, 1);
            }
            saveRestDays(restDays);

            if (newCount !== '' && newCount !== null) {
                setEditedCount(point.date, parseInt(newCount, 10));
            } else {
                setEditedCount(point.date, null);
            }

            modal.classList.remove('re-modal-visible');
            renderAnalysisData();
        };

        const resetHandler = () => {
            const restDays = getRestDays();
            const restIndex = restDays.indexOf(point.date);
            if (restIndex > -1) {
                restDays.splice(restIndex, 1);
                saveRestDays(restDays);
            }
            setEditedCount(point.date, null);

            if (restCheckbox) restCheckbox.checked = false;
            if (countInput) countInput.value = '';

            modal.classList.remove('re-modal-visible');
            renderAnalysisData();
        };

        saveBtn.onclick = saveHandler;
        resetBtn.onclick = resetHandler;

        modal.classList.add('re-modal-visible');
    }

    function updateAnalysisStats(data) {
        const totalEl = document.getElementById('re-stat-total');
        const avgEl = document.getElementById('re-stat-daily-avg');
        const maxOrdersEl = document.getElementById('re-stat-max-orders');
        const maxDateEl = document.getElementById('re-stat-max-date');
        const minOrdersEl = document.getElementById('re-stat-min-orders');
        const minDateEl = document.getElementById('re-stat-min-date');

        if (data.length === 0) {
            if (totalEl) totalEl.textContent = '0';
            if (avgEl) avgEl.textContent = '0';
            if (maxOrdersEl) maxOrdersEl.textContent = '0';
            if (maxDateEl) maxDateEl.textContent = '最高';
            if (minOrdersEl) minOrdersEl.textContent = '0';
            if (minDateEl) minDateEl.textContent = '最低';
            return;
        }

        const total = data.reduce((sum, d) => sum + d.count, 0);
        const avg = (total / data.length).toFixed(1);
        let maxItem = data[0], minItem = data[0];
        data.forEach(d => {
            if (d.count > maxItem.count) maxItem = d;
            if (d.count < minItem.count) minItem = d;
        });

        if (totalEl) totalEl.textContent = total;
        if (avgEl) avgEl.textContent = avg;
        if (maxOrdersEl) maxOrdersEl.textContent = maxItem.count;
        if (maxDateEl) maxDateEl.textContent = maxItem.date.slice(5);
        if (minOrdersEl) minOrdersEl.textContent = minItem.count;
        if (minDateEl) minDateEl.textContent = minItem.date.slice(5);
    }

    function renderModelAnalysis() {
        getAllHistoryRecords().then(records => {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const startDate = new Date(currentYear, currentMonth, 1);
            const currentDay = today.getDate();

            const dateList = [];
            for (let i = 0; i < currentDay; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                dateList.push(formatDateForAnalysis(date));
            }

            const modelMap = {};
            records.forEach(record => {
                if (!record.model || !record.date || !dateList.includes(record.date)) return;
                const name = simplifyModelName(record.model);
                if (!modelMap[name]) modelMap[name] = { name, total: 0, dates: {} };
                modelMap[name].total++;
                modelMap[name].dates[record.date] = (modelMap[name].dates[record.date] || 0) + 1;
            });

            const topModels = Object.values(modelMap)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            drawModelChart({ models: topModels, dates: dateList });
            renderModelLegend(topModels);
        });
    }

    function simplifyModelName(model) {
        if (!model) return '未知';
        const patterns = [
            /(iPhone\s*\d+\s*Pro\s*Max)/i,
            /(iPhone\s*\d+\s*Pro)/i,
            /(iPhone\s*\d+\s*Plus)/i,
            /(iPhone\s*\d+\s*mini)/i,
            /(iPhone\s*\d+)/i,
            /(\d+\s*Pro\s*Max)/i,
            /(\d+\s*Pro)/i,
            /(\d+\s*Plus)/i,
            /(\d+\s*mini)/i,
            /(iPhone\s*(?:SE|XR|XS))/i,
            /(iPhone\s*(?:11|12|13|14|15|16|17))/i
        ];
        for (const pattern of patterns) {
            const match = model.match(pattern);
            if (match) {
                let result = match[1].replace(/\s+/g, '').trim();
                result = result.replace(/iPhone/i, 'iPhone ');
                result = result.replace(/(\d+)Pro/i, '$1 Pro');
                result = result.replace(/ProMax/i, 'Pro Max');
                result = result.replace(/(\d+)Plus/i, '$1 Plus');
                result = result.replace(/(\d+)mini/i, '$1 mini');
                return result.trim();
            }
        }
        if (model.includes('iPhone')) return 'iPhone 其他';
        if (model.length > 15) return model.substring(0, 15) + '...';
        return model;
    }

    function drawModelChart(data) {
        const canvas = document.getElementById('re-model-chart');
        const tooltip = document.getElementById('re-model-tooltip');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const canvasW = rect.width - 32;
        const canvasH = 220;

        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        canvas.style.width = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 16, bottom: 36, left: 40 };
        const chartW = canvasW - padding.left - padding.right;
        const chartH = canvasH - padding.top - padding.bottom;

        ctx.clearRect(0, 0, canvasW, canvasH);

        if (data.models.length === 0 || data.dates.length === 0) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无机型数据', canvasW / 2, canvasH / 2);
            canvas.chartData = null;
            return;
        }

        let maxCount = 1;
        data.models.forEach(model => {
            data.dates.forEach(date => {
                const count = model.dates[date] || 0;
                if (count > maxCount) maxCount = count;
            });
        });

        const yScale = chartH / (maxCount + 1);
        const xStep = chartW / (data.dates.length - 1 || 1);
        const yGridCount = 4;
        const allPoints = [];

        // 从左到右绘制动画
        const animDuration = 800;
        const animStart = performance.now();

        function drawGrid() {
            ctx.strokeStyle = 'rgba(107, 114, 128, 0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= yGridCount; i++) {
                const y = padding.top + (chartH / yGridCount) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(canvasW - padding.right, y);
                ctx.stroke();
                const value = Math.round(maxCount - (maxCount / yGridCount) * i);
                ctx.fillStyle = '#9ca3af';
                ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(value.toString(), padding.left - 6, y);
            }
        }

        function drawXLabels() {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const step = Math.max(1, Math.ceil(data.dates.length / 8));
            data.dates.forEach((date, i) => {
                if (i % step === 0 || i === data.dates.length - 1) {
                    const x = padding.left + i * xStep;
                    const parts = date.split('-');
                    ctx.fillText(`${parts[1]}-${parts[2]}`, x, canvasH - padding.bottom + 8);
                }
            });
        }

        function animateModel(now) {
            const elapsed = now - animStart;
            const progress = Math.min(elapsed / animDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const drawCount = Math.ceil(data.dates.length * eased);

            ctx.clearRect(0, 0, canvasW, canvasH);
            drawGrid();

            allPoints.length = 0;

            data.models.forEach((model, modelIndex) => {
                const color = MODEL_COLORS[modelIndex % MODEL_COLORS.length];
                const points = [];

                for (let i = 0; i < drawCount; i++) {
                    const date = data.dates[i];
                    const count = model.dates[date] || 0;
                    const x = padding.left + i * xStep;
                    const y = padding.top + chartH - count * yScale;
                    points.push({ x, y, date, count, modelName: model.name, color });
                }

                // 折线
                if (points.length > 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';
                    points.forEach((p, i) => {
                        if (i === 0) ctx.moveTo(p.x, p.y);
                        else ctx.lineTo(p.x, p.y);
                    });
                    ctx.stroke();

                    // 数据点
                    points.forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                        ctx.fillStyle = '#fff';
                        ctx.fill();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    });
                }

                allPoints.push(...points);
            });

            drawXLabels();

            if (progress < 1) {
                requestAnimationFrame(animateModel);
            } else {
                canvas.chartData = { points: allPoints, padding };
                if (tooltip) {
                    canvas.onmousemove = function(e) {
                        const canvasRect = canvas.getBoundingClientRect();
                        const mouseX = e.clientX - canvasRect.left;
                        const mouseY = e.clientY - canvasRect.top;
                        let found = null;
                        for (const p of allPoints) {
                            if (Math.sqrt(Math.pow(mouseX - p.x, 2) + Math.pow(mouseY - p.y, 2)) <= 10) {
                                found = p;
                                break;
                            }
                        }
                        if (found) {
                            tooltip.innerHTML = `<strong>${found.modelName}</strong><br/>${found.date}<br/>审核量：${found.count}`;
                            tooltip.style.display = 'block';
                            tooltip.style.left = found.x + 'px';
                            tooltip.style.top = (found.y - 45) + 'px';
                        } else {
                            tooltip.style.display = 'none';
                        }
                    };
                    canvas.onmouseleave = function() {
                        tooltip.style.display = 'none';
                    };
                }
            }
        }
        requestAnimationFrame(animateModel);
    }

    function renderModelLegend(models) {
        const legendEl = document.getElementById('re-model-legend');
        if (!legendEl) return;
        legendEl.innerHTML = '';
        models.forEach((model, index) => {
            const color = MODEL_COLORS[index % MODEL_COLORS.length];
            const item = document.createElement('div');
            item.className = 're-legend-item';
            item.innerHTML = `<span class="re-legend-color" style="background: ${color}"></span><span>${model.name} (${model.total})</span>`;
            legendEl.appendChild(item);
        });
    }

    function renderHistoryRecords(searchTerm = '') {
        const container = document.getElementById('re-history-container');
        const emptyEl = document.getElementById('re-history-empty');

        if (!container) return;

        getAllHistoryRecords().then(records => {
            let filteredRecords = records;
            const term = searchTerm.trim().toLowerCase();

            if (term) {
                filteredRecords = records.filter(record =>
                    record.name && record.name.toLowerCase().includes(term)
                );
            }

            if (filteredRecords.length === 0) {
                if (emptyEl) emptyEl.style.display = 'flex';
                container.innerHTML = '';
                if (term) {
                    const noResult = document.createElement('div');
                    noResult.className = 're-history-no-result';
                    noResult.innerHTML = `
                        <svg class="re-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        <div class="re-empty-text">未找到 "${searchTerm.trim()}" 相关记录</div>
                    `;
                    container.appendChild(noResult);
                } else {
                    container.appendChild(emptyEl);
                }
                return;
            }

            if (emptyEl) emptyEl.style.display = 'none';

            // 按月份分组，再按日期分组
            const groupedByMonth = {};
            filteredRecords.forEach(record => {
                const month = record.date.substring(0, 7); // "2025-06"
                if (!groupedByMonth[month]) {
                    groupedByMonth[month] = {};
                }
                const date = record.date;
                if (!groupedByMonth[month][date]) {
                    groupedByMonth[month][date] = [];
                }
                groupedByMonth[month][date].push(record);
            });

            // 每个日期内按时间排序
            Object.keys(groupedByMonth).forEach(month => {
                Object.keys(groupedByMonth[month]).forEach(date => {
                    groupedByMonth[month][date].sort((a, b) => {
                        if (a.time && b.time) {
                            return b.time.localeCompare(a.time);
                        }
                        return b.id - a.id;
                    });
                });
            });

            // 当前月份（默认展开）
            const currentMonth = new Date().toISOString().substring(0, 7);

            // 按月份倒序排序
            const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

            let monthSectionsHtml = '';

            sortedMonths.forEach(month => {
                const monthObj = new Date(month + '-01');
                const monthStr = `${monthObj.getFullYear()}年${monthObj.getMonth() + 1}月`;
                const monthData = groupedByMonth[month];
                const monthTotalCount = Object.values(monthData).reduce((sum, arr) => sum + arr.length, 0);
                const isCurrentMonth = month === currentMonth;

                // 生成该月份下的所有日期卡片
                let dayCards = [];
                const sortedDates = Object.keys(monthData).sort((a, b) => new Date(b) - new Date(a));

                sortedDates.forEach(date => {
                    const dateObj = new Date(date);
                    const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                    const items = monthData[date];
                const totalCount = items.length;
                const displayCount = 4;
                const hasMore = totalCount > displayCount;

                let itemsHtml = '';
                items.forEach((item, index) => {
                    const isHidden = index >= displayCount;
                    itemsHtml += `
                        <div class="re-history-item ${isHidden ? 're-history-item-hidden' : ''}" data-id="${item.id}">
                            <div class="re-history-item-header">
                                <span class="re-history-item-index">${index + 1}</span>
                                <span class="re-history-item-name">${item.name || '未知'}</span>
                                <span class="re-history-item-model">${item.model || '未知机型'}</span>
                                <span class="re-history-item-shop">${item.shop || '未知店铺'}</span>
                                <button class="re-history-item-delete" data-id="${item.id}" title="删除">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div class="re-history-item-preview" data-preview="${encodeURIComponent(item.preview || '')}"></div>
                        </div>
                    `;
                });

                dayCards.push(`
                    <div class="re-history-day-card" data-date="${date}">
                        <div class="re-history-day-header">
                            <span class="re-history-day-title">${dateStr}</span>
                            <span class="re-history-day-count">共 ${totalCount} 条</span>
                            <div class="re-history-day-actions">
                                <button class="re-history-day-more" data-date="${date}" title="展开更多" style="${hasMore ? '' : 'display:none;'}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="1"></circle>
                                        <circle cx="19" cy="12" r="1"></circle>
                                        <circle cx="5" cy="12" r="1"></circle>
                                    </svg>
                                </button>
                                <button class="re-history-day-collapse" data-date="${date}" title="折叠" style="display:none;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="18 15 12 9 6 15"></polyline>
                                    </svg>
                                </button>
                                <button class="re-history-day-export" data-date="${date}" title="导出Excel">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                </button>
                                <button class="re-history-day-delete" data-date="${date}" title="删除当日记录">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="re-history-day-content collapsed">${itemsHtml}</div>
                    </div>
                `);
                });

                // 将该月份的日期卡片按每行3个分组
                let rowsHtml = '';
                for (let i = 0; i < dayCards.length; i += 3) {
                    const rowCards = dayCards.slice(i, i + 3);
                    rowsHtml += `<div class="re-history-day-row">${rowCards.join('')}</div>`;
                }

                // 生成月份折叠容器
                monthSectionsHtml += `
                    <div class="re-history-month-section ${isCurrentMonth ? 'expanded' : 'collapsed'}" data-month="${month}">
                        <div class="re-history-month-header">
                            <button class="re-history-month-toggle" data-month="${month}">
                                <svg class="re-history-month-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="${isCurrentMonth ? '6 9 12 15 18 9' : '9 18 15 12 9 6'}"></polyline>
                                </svg>
                            </button>
                            <span class="re-history-month-title">${monthStr}</span>
                            <span class="re-history-month-count">共 ${monthTotalCount} 条</span>
                            <button class="re-history-month-export" data-month="${month}" title="导出整月数据">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </button>
                            <button class="re-history-month-delete" data-month="${month}" title="删除此月份所有记录">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="re-history-month-content ${isCurrentMonth ? '' : 're-hidden'}">
                            ${rowsHtml}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = monthSectionsHtml;

            // 月份折叠交互
            container.querySelectorAll('.re-history-month-toggle').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const section = this.closest('.re-history-month-section');
                    const content = section.querySelector('.re-history-month-content');
                    const icon = this.querySelector('.re-history-month-toggle-icon polyline');

                    if (content.classList.contains('re-hidden')) {
                        // 展开
                        content.classList.remove('re-hidden');
                        section.classList.remove('collapsed');
                        section.classList.add('expanded');
                        icon.setAttribute('points', '6 9 12 15 18 9');
                    } else {
                        // 折叠
                        content.classList.add('re-hidden');
                        section.classList.remove('expanded');
                        section.classList.add('collapsed');
                        icon.setAttribute('points', '9 18 15 12 9 6');
                    }
                });
            });

            // 月份导出交互
            container.querySelectorAll('.re-history-month-export').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const month = this.getAttribute('data-month');
                    const monthRecords = [];
                    const monthData = groupedByMonth[month];
                    if (monthData) {
                        Object.keys(monthData).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
                            monthRecords.push(...monthData[date]);
                        });
                    }
                    if (monthRecords.length > 0) {
                        getStaffName().then(staffName => {
                            exportMonthToExcel(month, monthRecords, staffName || '客服');
                        });
                    }
                });
            });

            // 月份删除交互
            container.querySelectorAll('.re-history-month-delete').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const month = this.getAttribute('data-month');
                    const monthObj = new Date(month + '-01');
                    const monthStr = `${monthObj.getFullYear()}年${monthObj.getMonth() + 1}月`;

                    if (confirm(`确定删除 ${monthStr} 的所有记录？`)) {
                        deleteHistoryRecordsByMonth(month).then(() => {
                            const searchInput = document.getElementById('re-history-search');
                            const term = searchInput ? searchInput.value.trim() : '';
                            renderHistoryRecords(term);
                        }).catch(err => {
                            alert('删除失败，请重试');
                        });
                    }
                });
            });

            container.querySelectorAll('.re-history-day-more').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const card = this.closest('.re-history-day-card');
                    const content = card.querySelector('.re-history-day-content');
                    const collapseBtn = card.querySelector('.re-history-day-collapse');

                    content.classList.add('expanded');
                    content.classList.remove('collapsed');
                    hiddenItems = card.querySelectorAll('.re-history-item-hidden');
                    hiddenItems.forEach(item => {
                        item.classList.remove('re-history-item-hidden');
                    });
                    this.style.display = 'none';
                    collapseBtn.style.display = 'flex';
                });
            });

            container.querySelectorAll('.re-history-day-collapse').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const card = this.closest('.re-history-day-card');
                    const content = card.querySelector('.re-history-day-content');
                    const moreBtn = card.querySelector('.re-history-day-more');
                    const items = card.querySelectorAll('.re-history-item');
                    const displayCount = 4;

                    items.forEach((item, index) => {
                        if (index >= displayCount) {
                            item.classList.add('re-history-item-hidden');
                        }
                    });

                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    this.style.display = 'none';
                    if (items.length > displayCount) {
                        moreBtn.style.display = 'flex';
                    }
                });
            });

            container.querySelectorAll('.re-history-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    if (e.target.closest('.re-history-item-delete')) return;

                    const previewEl = this.querySelector('.re-history-item-preview');
                    const previewText = decodeURIComponent(previewEl.getAttribute('data-preview') || '');

                    if (previewText && !previewEl.classList.contains('show')) {
                        previewEl.textContent = previewText;
                        previewEl.classList.add('show');
                    } else {
                        previewEl.classList.remove('show');
                        previewEl.textContent = '';
                    }
                });
            });

            container.querySelectorAll('.re-history-item-delete').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = parseInt(this.getAttribute('data-id'));
                    if (confirm('确定删除此记录？')) {
                        deleteHistoryRecord(id).then(() => {
                            const searchInput = document.getElementById('re-history-search');
                            const term = searchInput ? searchInput.value.trim() : '';
                            renderHistoryRecords(term);
                        }).catch(err => {
                        });
                    }
                });
            });

            container.querySelectorAll('.re-history-day-export').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const date = this.getAttribute('data-date');
                    let dateRecords = [];
                    for (const month of Object.values(groupedByMonth)) {
                        if (month[date]) {
                            dateRecords = month[date];
                            break;
                        }
                    }
                    getStaffName().then(staffName => {
                        exportToExcel(date, dateRecords, staffName || '客服');
                    });
                });
            });

            container.querySelectorAll('.re-history-day-delete').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const date = this.getAttribute('data-date');
                    if (confirm('确定删除 ' + date + ' 的所有记录？')) {
                        deleteHistoryRecordsByDate(date).then(() => {
                            const searchInput = document.getElementById('re-history-search');
                            const term = searchInput ? searchInput.value.trim() : '';
                            renderHistoryRecords(term);
                        }).catch(err => {
                        });
                    }
                });
            });

        }).catch(err => {
        });
    }

    const historySearchInput = document.getElementById('re-history-search');
    let searchTimeout = null;
    if (historySearchInput) {
        historySearchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const term = this.value.trim();
            searchTimeout = setTimeout(() => {
                renderHistoryRecords(term);
            }, CONFIG.TIME.debounceDelay);
        });
    }

    const SELECT_OPTIONS_DB_NAME = 'ReSystemSelectOptionsDB';
    const SELECT_OPTIONS_STORE_NAME = 'options';
    let selectOptionsDb = null;

    function openSelectOptionsDB() {
        return new Promise((resolve, reject) => {
            if (selectOptionsDb) {
                resolve(selectOptionsDb);
                return;
            }
            const request = indexedDB.open(SELECT_OPTIONS_DB_NAME, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                selectOptionsDb = request.result;
                resolve(selectOptionsDb);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(SELECT_OPTIONS_STORE_NAME)) {
                    db.createObjectStore(SELECT_OPTIONS_STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    function getSelectOptions(selectId) {
        return new Promise((resolve, reject) => {
            openSelectOptionsDB().then(db => {
                const transaction = db.transaction(SELECT_OPTIONS_STORE_NAME, 'readonly');
                const store = transaction.objectStore(SELECT_OPTIONS_STORE_NAME);
                const request = store.get(selectId);
                request.onsuccess = () => resolve(request.result ? request.result.options : []);
                request.onerror = () => reject(request.error);
            }).catch(reject);
        });
    }

    function saveSelectOptions(selectId, options) {
        return new Promise((resolve, reject) => {
            openSelectOptionsDB().then(db => {
                const transaction = db.transaction(SELECT_OPTIONS_STORE_NAME, 'readwrite');
                const store = transaction.objectStore(SELECT_OPTIONS_STORE_NAME);
                const request = store.put({ id: selectId, options: options });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }).catch(reject);
        });
    }

    let manageModal = null;

    function initManageModal() {
        if (document.getElementById('re-select-manage-modal')) return;

        manageModal = document.createElement('div');
        manageModal.id = 're-select-manage-modal';
        manageModal.className = 're-select-manage-modal';
        manageModal.innerHTML = `
            <div class="re-select-manage-content">
                <div class="re-select-manage-title" id="re-manage-title">管理选项</div>
                <div class="re-select-manage-list" id="re-manage-list"></div>
                <div class="re-select-manage-add">
                    <input type="text" id="re-manage-new-option" placeholder="输入新选项">
                    <button class="re-select-manage-add-btn" id="re-manage-add-btn">添加</button>
                </div>
                <div class="re-select-manage-footer">
                    <button class="re-select-manage-close" id="re-manage-close">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(manageModal);

        manageModal.addEventListener('click', function(e) {
            if (e.target === manageModal) {
                manageModal.classList.remove('show');
            }
        });

        document.getElementById('re-manage-close').addEventListener('click', function() {
            manageModal.classList.remove('show');
        });

        document.getElementById('re-manage-add-btn').addEventListener('click', function() {
            const input = document.getElementById('re-manage-new-option');
            const newValue = input.value.trim();
            if (newValue && manageModal.currentSelectId) {
                addNewOption(manageModal.currentSelectId, newValue);
                input.value = '';
            }
        });

        document.getElementById('re-manage-new-option').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('re-manage-add-btn').click();
            }
        });
    }

    function showManageModal(selectId) {
        const select = document.getElementById(selectId);
        if (!select || !manageModal) return;

        manageModal.currentSelectId = selectId;

        const selectLabels = {
            're-old-device-type': '旧机选项',
            're-salary-type': '薪资类型',
            're-work-proof': '工作证明',
            're-order-result': '审核结果',
            're-expand-order-result': '拓展结果',
            're-handle-method': '办理方式',
            're-expand-type': '拓展类型'
        };

        document.getElementById('re-manage-title').textContent = `管理${selectLabels[selectId] || '选项'}`;

        renderManageList(selectId);
        manageModal.classList.add('show');
    }

    function renderManageList(selectId) {
        const select = document.getElementById(selectId);
        const listEl = document.getElementById('re-manage-list');

        if (!select || !listEl) return;

        let html = '';
        Array.from(select.options).forEach((opt, idx) => {
            const isCustom = opt.getAttribute('data-custom') === 'true';
            html += `
                <div class="re-select-manage-item ${isCustom ? 'custom' : ''}" data-idx="${idx}">
                    <span class="re-select-manage-item-text">${opt.textContent}${isCustom ? ' (自定义)' : ''}</span>
                    ${isCustom ? `<button class="re-select-manage-item-delete" data-select-id="${selectId}" data-value="${opt.value}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>` : ''}
                </div>
            `;
        });
        listEl.innerHTML = html;

        listEl.querySelectorAll('.re-select-manage-item-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const selectId = this.getAttribute('data-select-id');
                const value = this.getAttribute('data-value');
                deleteOption(selectId, value);
            });
        });
    }

    function addNewOption(selectId, value) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const exists = Array.from(select.options).some(opt => opt.textContent === value);
        if (!exists) {
            const option = document.createElement('option');
            option.textContent = value;
            option.setAttribute('data-custom', 'true');
            select.appendChild(option);

            const customOptions = Array.from(select.options)
                .filter(opt => opt.getAttribute('data-custom') === 'true')
                .map(opt => opt.textContent);
            saveSelectOptions(selectId, customOptions).catch(err => {
            });

            renderManageList(selectId);
        }
    }

    function deleteOption(selectId, value) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const optionToRemove = Array.from(select.options).find(opt => opt.value === value);
        if (optionToRemove) {
            optionToRemove.remove();

            const customOptions = Array.from(select.options)
                .filter(opt => opt.getAttribute('data-custom') === 'true')
                .map(opt => opt.textContent);
            saveSelectOptions(selectId, customOptions).catch(err => {
            });

            renderManageList(selectId);
        }
    }

    const MULTI_SELECT_OPTIONS_DB = 'ReSystemMultiSelectDB';
    const MULTI_SELECT_STORE = 'options';
    let multiSelectDb = null;

    function openMultiSelectDB() {
        return new Promise((resolve, reject) => {
            if (multiSelectDb) {
                resolve(multiSelectDb);
                return;
            }
            const request = indexedDB.open(MULTI_SELECT_OPTIONS_DB, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                multiSelectDb = request.result;
                resolve(multiSelectDb);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(MULTI_SELECT_STORE)) {
                    db.createObjectStore(MULTI_SELECT_STORE, { keyPath: 'id' });
                }
            };
        });
    }

    function getMultiSelectOptions(id) {
        return new Promise((resolve, reject) => {
            openMultiSelectDB().then(db => {
                const transaction = db.transaction(MULTI_SELECT_STORE, 'readonly');
                const store = transaction.objectStore(MULTI_SELECT_STORE);
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result ? request.result.options : []);
                request.onerror = () => reject(request.error);
            }).catch(reject);
        });
    }

    function saveMultiSelectOptions(id, options) {
        return new Promise((resolve, reject) => {
            openMultiSelectDB().then(db => {
                const transaction = db.transaction(MULTI_SELECT_STORE, 'readwrite');
                const store = transaction.objectStore(MULTI_SELECT_STORE);
                const request = store.put({ id: id, options: options });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }).catch(reject);
        });
    }

    function initMultiSelect() {
        const multiSelects = document.querySelectorAll('.re-multi-select');

        multiSelects.forEach(multiSelect => {
            const header = multiSelect.querySelector('.re-multi-select-header');
            const textEl = multiSelect.querySelector('.re-multi-select-text');
            const itemsContainer = multiSelect.querySelector('.re-multi-select-items');
            const manageBtn = multiSelect.querySelector('.re-multi-select-manage');
            const multiSelectId = multiSelect.id;

            const defaultOptions = ['有近三个月证明', '无证明', '有社保', '有公积金'];

            function renderOptions(options) {
                itemsContainer.innerHTML = '';
                options.forEach(opt => {
                    const label = document.createElement('label');
                    label.className = 're-multi-select-item';
                    label.innerHTML = `
                        <input type="checkbox" value="${opt}">
                        <span>${opt}</span>
                    `;
                    itemsContainer.appendChild(label);

                    label.querySelector('input').addEventListener('change', function() {
                        updateText();
                        if (typeof updateRiskPreview === 'function') {
                            updateRiskPreview();
                        }
                    });
                });
            }

            function updateText() {
                const checkboxes = multiSelect.querySelectorAll('input[type="checkbox"]:checked');
                const selected = Array.from(checkboxes).map(cb => cb.value);

                if (selected.length === 0) {
                    textEl.textContent = '选择证明';
                } else if (selected.length > 2) {
                    textEl.textContent = `已勾选${selected.length}条数据`;
                } else {
                    textEl.textContent = selected.join('、');
                }
            }

            getMultiSelectOptions(multiSelectId).then(savedOptions => {
                const options = savedOptions.length > 0 ? savedOptions : defaultOptions;
                renderOptions(options);
                updateText();
            }).catch(err => {
                renderOptions(defaultOptions);
                updateText();
            });

            header.addEventListener('click', function(e) {
                e.stopPropagation();
                multiSelect.classList.toggle('open');
            });

            if (manageBtn) {
                manageBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    multiSelect.classList.remove('open');
                    showMultiSelectManageModal(multiSelectId, defaultOptions, renderOptions);
                });
            }
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.re-multi-select')) {
                document.querySelectorAll('.re-multi-select.open').forEach(el => {
                    el.classList.remove('open');
                });
            }
        });
    }

    function showMultiSelectManageModal(multiSelectId, defaultOptions, renderCallback) {
        let manageModal = document.getElementById('re-multi-select-manage-modal');
        if (!manageModal) {
            manageModal = document.createElement('div');
            manageModal.id = 're-multi-select-manage-modal';
            manageModal.className = 're-select-manage-modal';
            manageModal.innerHTML = `
                <div class="re-select-manage-content">
                    <div class="re-select-manage-header">
                        <span class="re-select-manage-title">管理工作证明选项</span>
                        <button class="re-select-manage-close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="re-select-manage-body">
                        <div class="re-select-manage-add">
                            <input type="text" class="re-select-manage-input" placeholder="输入新选项">
                            <button class="re-select-manage-add-btn">添加</button>
                        </div>
                        <div class="re-select-manage-list" id="re-multi-select-manage-list"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(manageModal);

            manageModal.querySelector('.re-select-manage-close').addEventListener('click', function() {
                manageModal.classList.remove('show');
            });

            manageModal.addEventListener('click', function(e) {
                if (e.target === manageModal) {
                    manageModal.classList.remove('show');
                }
            });
        }

        manageModal.querySelector('.re-select-manage-title').textContent = '管理工作证明选项';

        function renderManageList(options) {
            const listEl = manageModal.querySelector('#re-multi-select-manage-list');
            let html = '';
            options.forEach((opt, idx) => {
                const isDefault = defaultOptions.includes(opt);
                html += `
                    <div class="re-select-manage-item ${isDefault ? '' : 'custom'}" data-idx="${idx}" draggable="true">
                        <div class="re-select-manage-item-left">
                            <span class="re-select-manage-drag-handle">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="9" cy="6" r="1"></circle>
                                    <circle cx="15" cy="6" r="1"></circle>
                                    <circle cx="9" cy="12" r="1"></circle>
                                    <circle cx="15" cy="12" r="1"></circle>
                                    <circle cx="9" cy="18" r="1"></circle>
                                    <circle cx="15" cy="18" r="1"></circle>
                                </svg>
                            </span>
                            <span class="re-select-manage-item-text">${opt}${isDefault ? '' : ' (自定义)'}</span>
                        </div>
                        ${!isDefault ? `<button class="re-select-manage-item-delete" data-value="${opt}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>` : ''}
                    </div>
                `;
            });
            listEl.innerHTML = html;

            listEl.querySelectorAll('.re-select-manage-item-delete').forEach(btn => {
                btn.addEventListener('click', function() {
                    const value = this.getAttribute('data-value');
                    getMultiSelectOptions(multiSelectId).then(savedOptions => {
                        const options = savedOptions.length > 0 ? savedOptions : [...defaultOptions];
                        const newOptions = options.filter(opt => opt !== value);
                        saveMultiSelectOptions(multiSelectId, newOptions).then(() => {
                            renderManageList(newOptions);
                            renderCallback(newOptions);
                        });
                    });
                });
            });

            let draggedItem = null;
            listEl.querySelectorAll('.re-select-manage-item').forEach(item => {
                item.addEventListener('dragstart', function(e) {
                    draggedItem = this;
                    this.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });

                item.addEventListener('dragend', function() {
                    this.classList.remove('dragging');
                    listEl.querySelectorAll('.re-select-manage-item').forEach(i => {
                        i.classList.remove('drag-over');
                    });
                });

                item.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (this !== draggedItem) {
                        this.classList.add('drag-over');
                    }
                });

                item.addEventListener('dragleave', function() {
                    this.classList.remove('drag-over');
                });

                item.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.classList.remove('drag-over');

                    if (this !== draggedItem) {
                        const allItems = Array.from(listEl.querySelectorAll('.re-select-manage-item'));
                        const fromIdx = allItems.indexOf(draggedItem);
                        const toIdx = allItems.indexOf(this);

                        getMultiSelectOptions(multiSelectId).then(savedOptions => {
                            const opts = savedOptions.length > 0 ? savedOptions : [...defaultOptions];
                            const [movedItem] = opts.splice(fromIdx, 1);
                            opts.splice(toIdx, 0, movedItem);
                            saveMultiSelectOptions(multiSelectId, opts).then(() => {
                                renderManageList(opts);
                                renderCallback(opts);
                            });
                        });
                    }
                });
            });
        }

        const addInput = manageModal.querySelector('.re-select-manage-input');
        const addBtn = manageModal.querySelector('.re-select-manage-add-btn');

        addInput.value = '';

        addBtn.onclick = function() {
            const newValue = addInput.value.trim();
            if (newValue) {
                getMultiSelectOptions(multiSelectId).then(savedOptions => {
                    const options = savedOptions.length > 0 ? savedOptions : [...defaultOptions];
                    if (!options.includes(newValue)) {
                        options.push(newValue);
                        saveMultiSelectOptions(multiSelectId, options).then(() => {
                            renderManageList(options);
                            renderCallback(options);
                            addInput.value = '';
                        });
                    }
                });
            }
        };

        addInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        };

        getMultiSelectOptions(multiSelectId).then(savedOptions => {
            const options = savedOptions.length > 0 ? savedOptions : [...defaultOptions];
            renderManageList(options);
        });

        manageModal.classList.add('show');
    }

    function getMultiSelectValues(id) {
        const multiSelect = document.getElementById(id);
        if (!multiSelect) return [];

        const checkboxes = multiSelect.querySelectorAll('.re-multi-select-items input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    function initEditableSelects() {
        const editableSelectIds = [
            're-old-device-type',
            're-salary-type',
            're-order-result',
            're-expand-order-result',
            're-handle-method',
            're-expand-type'
        ];

        if (document.querySelector('.re-select-editable-wrapper')) {
            return;
        }

        initManageModal();
        initMultiSelect();

        editableSelectIds.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            const wrapper = document.createElement('div');
            wrapper.className = 're-select-editable-wrapper';
            wrapper.setAttribute('data-select-id', selectId);

            select.parentNode.insertBefore(wrapper, select);
            wrapper.appendChild(select);

            const dropdown = document.createElement('div');
            dropdown.className = 're-select-dropdown';
            wrapper.appendChild(dropdown);

            getSelectOptions(selectId).then(savedOptions => {
                savedOptions.forEach(optionText => {
                    const option = document.createElement('option');
                    option.textContent = optionText;
                    option.setAttribute('data-custom', 'true');
                    select.appendChild(option);
                });
            }).catch(err => {
            });

            function renderDropdown() {
                const currentValue = select.value;
                let itemsHtml = '';

                Array.from(select.options).forEach((opt, idx) => {
                    const isCustom = opt.getAttribute('data-custom') === 'true';
                    const selected = opt.value === currentValue ? 'selected' : '';
                    itemsHtml += `<div class="re-select-dropdown-item ${selected} ${isCustom ? 'custom' : ''}" data-value="${opt.value}">${opt.textContent}</div>`;
                });

                itemsHtml += `
                    <div class="re-select-dropdown-manage" data-select-id="${selectId}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        管理选项
                    </div>
                `;

                dropdown.innerHTML = itemsHtml;
            }

            select.addEventListener('mousedown', function(e) {
                e.preventDefault();
                renderDropdown();
                dropdown.classList.toggle('show');
            });

            select.addEventListener('focus', function() {
                renderDropdown();
                dropdown.classList.add('show');
            });

            dropdown.addEventListener('click', function(e) {
                const item = e.target.closest('.re-select-dropdown-item');
                const manageBtn = e.target.closest('.re-select-dropdown-manage');

                if (item) {
                    select.value = item.getAttribute('data-value');
                    dropdown.classList.remove('show');
                    select.dispatchEvent(new Event('change'));
                } else if (manageBtn) {
                    dropdown.classList.remove('show');
                    showManageModal(selectId);
                }
            });

            document.addEventListener('click', function(e) {
                if (!wrapper.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });
        });
    }

    function showStaffInputModal() {
        const modal = document.getElementById('re-staff-input-modal');
        const input = document.getElementById('re-staff-input');
        const cancelBtn = document.getElementById('re-staff-cancel');
        const confirmBtn = document.getElementById('re-staff-confirm');

        if (modal && input && cancelBtn && confirmBtn) {
            modal.classList.add('re-modal-visible');
            input.value = '';
            input.focus();

            getStaffName().then(currentName => {
                if (currentName) {
                    input.value = currentName;
                    input.setSelectionRange(currentName.length, currentName.length);
                }
            }).catch(() => {});

            const handleConfirm = () => {
                const name = input.value.trim();
                if (name) {
                    setStaffName(name).then(() => {
                        const staffNameEl = document.getElementById('re-staff-name');
                        if (staffNameEl) {
                            staffNameEl.textContent = name;
                        }
                        updateStaffNameDesc(name);
                        modal.classList.remove('re-modal-visible');
                    }).catch(() => {
                        alert('保存姓名失败，请重试');
                    });
                }
            };

            const handleCancel = () => {
                modal.classList.remove('re-modal-visible');
            };

            confirmBtn.onclick = handleConfirm;
            cancelBtn.onclick = handleCancel;

            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                } else if (e.key === 'Escape') {
                    handleCancel();
                }
            };
        }
    }

    function updateStaffNameDesc(name) {
        const staffDesc = document.getElementById('re-setting-staff-desc');
        if (staffDesc) {
            staffDesc.textContent = name ? '当前：' + name : '当前：未设置';
        }
    }

    function initStaffName() {
        const staffNameEl = document.getElementById('re-staff-name');
        if (cachedStaffName && staffNameEl) {
            staffNameEl.textContent = cachedStaffName;
            updateStaffNameDesc(cachedStaffName);
        }
        const shouldPrompt = () => panel && !panel.classList.contains('re-panel-hidden');
        getStaffName().then(name => {
            cachedStaffName = name || '';
            const el = document.getElementById('re-staff-name');
            if (name) {
                if (el) {
                    el.textContent = name;
                }
                updateStaffNameDesc(name);
            } else {
                if (el) {
                    el.textContent = '';
                }
                updateStaffNameDesc('');
                if (shouldPrompt()) {
                    showStaffInputModal();
                }
            }
        }).catch(err => {
            const el = document.getElementById('re-staff-name');
            if (el) {
                el.textContent = '';
            }
            updateStaffNameDesc('');
            if (shouldPrompt()) {
                showStaffInputModal();
            }
        });
    }

    let isDragging = false;
    let isResizing = false;
    let justFinishedInteraction = false;
    let dragStartX, dragStartY;
    let panelStartX, panelStartY;

    function openLayerLink(linkEl) {
        const panel = document.getElementById('re-system-panel');
        if (panel) panel.style.zIndex = '100';
        justFinishedInteraction = true;
        linkEl.setAttribute('data-width', '700');
        linkEl.click();
        const restoreZ = setInterval(() => {
            if (!document.querySelector('.layui-layer')) {
                if (panel) panel.style.zIndex = '';
                clearInterval(restoreZ);
            }
        }, 500);
    }

    function savePanelPosition() {
        const rect = panel.getBoundingClientRect();
        GM_setValue('re_panel_left', rect.left);
        GM_setValue('re_panel_top', rect.top);
        GM_setValue('re_panel_width', rect.width);
        GM_setValue('re_panel_height', rect.height);
    }

    function restorePanelPosition() {
        const savedLeft = GM_getValue('re_panel_left', null);
        const savedTop = GM_getValue('re_panel_top', null);
        const savedWidth = GM_getValue('re_panel_width', null);
        const savedHeight = GM_getValue('re_panel_height', null);

        if (savedWidth && savedHeight) {
            panel.style.width = `${savedWidth}px`;
            panel.style.height = `${savedHeight}px`;
        }

        if (savedLeft !== null && savedTop !== null) {
            panel.style.left = `${savedLeft}px`;
            panel.style.top = `${savedTop}px`;
            panel.style.transform = 'none';
        }
    }

    restorePanelPosition();

    const confirmModal = document.getElementById('re-confirm-modal');
    const confirmOkBtn = document.getElementById('re-confirm-ok');
    const confirmCancelBtn = document.getElementById('re-confirm-cancel');
    let pendingShowPanel = false;
    let currentOrderRow = document.querySelector('#table tbody tr');
    let autoAgeEnabled = false;
    let autoFetchEnabled = false;
    let autoContactQueryEnabled = false;
    let preventRefreshEnabled = false;
    let autoRefreshEnabled = true;
    let lowPerfEnabled = false;

    const lazyInit = {
        appearance: false,
        history: false,
        analysis: false,
        analysisEvents: false
    };

    function loadAutoAgeSetting() {
        const saved = localStorage.getItem(CONFIG.STORAGE.autoAgeKey);
        autoAgeEnabled = saved === 'true';
        const autoAgeCheckbox = document.getElementById('re-setting-auto-age');
        if (autoAgeCheckbox) {
            autoAgeCheckbox.checked = autoAgeEnabled;
        }
    }

    function saveAutoAgeSetting(enabled) {
        localStorage.setItem(CONFIG.STORAGE.autoAgeKey, enabled.toString());
        autoAgeEnabled = enabled;
    }

    function loadAutoFetchSetting() {
        const saved = localStorage.getItem(CONFIG.STORAGE.autoFetchKey);
        autoFetchEnabled = saved === 'true';
        const autoFetchCheckbox = document.getElementById('re-setting-auto-fetch');
        if (autoFetchCheckbox) {
            autoFetchCheckbox.checked = autoFetchEnabled;
        }
    }

    function saveAutoFetchSetting(enabled) {
        localStorage.setItem(CONFIG.STORAGE.autoFetchKey, enabled.toString());
        autoFetchEnabled = enabled;
    }

    function loadAutoContactQuerySetting() {
        const saved = localStorage.getItem(CONFIG.STORAGE.autoContactQueryKey);
        autoContactQueryEnabled = saved === 'true';
        const autoContactQueryCheckbox = document.getElementById('re-setting-auto-contact-query');
        if (autoContactQueryCheckbox) {
            autoContactQueryCheckbox.checked = autoContactQueryEnabled;
        }
    }

    function saveAutoContactQuerySetting(enabled) {
        localStorage.setItem(CONFIG.STORAGE.autoContactQueryKey, enabled.toString());
        autoContactQueryEnabled = enabled;
    }

    function loadPreventRefreshSetting() {
        const saved = localStorage.getItem(CONFIG.STORAGE.preventRefreshKey);
        preventRefreshEnabled = saved === 'true';
        const preventRefreshCheckbox = document.getElementById('re-setting-prevent-refresh');
        if (preventRefreshCheckbox) {
            preventRefreshCheckbox.checked = preventRefreshEnabled;
        }
    }

    function savePreventRefreshSetting(enabled) {
        localStorage.setItem(CONFIG.STORAGE.preventRefreshKey, enabled.toString());
        preventRefreshEnabled = enabled;
    }

    function loadAutoRefreshSetting() {
        const saved = localStorage.getItem(CONFIG.STORAGE.autoRefreshKey);
        autoRefreshEnabled = saved === null ? true : saved === 'true';
        const autoRefreshCheckbox = document.getElementById('re-setting-auto-refresh');
        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.checked = autoRefreshEnabled;
        }
    }

    function saveAutoRefreshSetting(enabled) {
        localStorage.setItem(CONFIG.STORAGE.autoRefreshKey, enabled.toString());
        autoRefreshEnabled = enabled;
    }

    function loadLowPerfSetting() {
        const saved = localStorage.getItem(CONFIG.STORAGE.lowPerfKey);
        lowPerfEnabled = saved === 'true';
        const lowPerfCheckbox = document.getElementById('re-setting-low-perf');
        if (lowPerfCheckbox) {
            lowPerfCheckbox.checked = lowPerfEnabled;
        }
        if (lowPerfEnabled) {
            panel.classList.add('re-low-perf');
        }
    }

    function saveLowPerfSetting(enabled) {
        localStorage.setItem(CONFIG.STORAGE.lowPerfKey, enabled.toString());
        lowPerfEnabled = enabled;
        if (enabled) {
            panel.classList.add('re-low-perf');
        } else {
            panel.classList.remove('re-low-perf');
        }
    }

    loadAutoAgeSetting();
    loadAutoFetchSetting();
    loadAutoContactQuerySetting();
    loadPreventRefreshSetting();
    loadAutoRefreshSetting();
    loadLowPerfSetting();

    openStaffDB().then(() => {
        return getStaffName();
    }).then(name => {
        cachedStaffName = name || '';
    }).catch(() => {});

    const settingsTabs = document.querySelectorAll('.re-settings-tab');
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            settingsTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.re-settings-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            const targetPanel = document.getElementById('re-settings-' + tabName);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    const autoAgeCheckbox = document.getElementById('re-setting-auto-age');
    if (autoAgeCheckbox) {
        autoAgeCheckbox.addEventListener('change', function() {
            saveAutoAgeSetting(this.checked);
        });
    }

    const autoFetchCheckbox = document.getElementById('re-setting-auto-fetch');
    if (autoFetchCheckbox) {
        autoFetchCheckbox.addEventListener('change', function() {
            saveAutoFetchSetting(this.checked);
        });
    }

    const autoContactQueryCheckbox = document.getElementById('re-setting-auto-contact-query');
    if (autoContactQueryCheckbox) {
        autoContactQueryCheckbox.addEventListener('change', function() {
            saveAutoContactQuerySetting(this.checked);
        });
    }

    const preventRefreshCheckbox = document.getElementById('re-setting-prevent-refresh');
    if (preventRefreshCheckbox) {
        preventRefreshCheckbox.addEventListener('change', function() {
            savePreventRefreshSetting(this.checked);
        });
    }

    const autoRefreshCheckbox = document.getElementById('re-setting-auto-refresh');
    if (autoRefreshCheckbox) {
        autoRefreshCheckbox.addEventListener('change', function() {
            saveAutoRefreshSetting(this.checked);
        });
    }

    const lowPerfCheckbox = document.getElementById('re-setting-low-perf');
    if (lowPerfCheckbox) {
        lowPerfCheckbox.addEventListener('change', function() {
            saveLowPerfSetting(this.checked);
        });
    }

    const staffNameCard = document.getElementById('re-setting-staff-name-card');
    if (staffNameCard) {
        staffNameCard.addEventListener('click', function() {
            showStaffInputModal();
        });
    }

    window.addEventListener('beforeunload', function(e) {
        if (!preventRefreshEnabled) return;

        const zhimaCreditInput = document.getElementById('re-zhima-credit');
        if (zhimaCreditInput && zhimaCreditInput.value.trim() !== '') {
            e.preventDefault();
            e.returnValue = '已有相关数据，确定要刷新页面吗？';
            return e.returnValue;
        }
    });

    function getCurrentOrderRow() {
        return currentOrderRow || document.querySelector('#table tbody tr');
    }

    function getCurrentCustomerCell() {
        const row = getCurrentOrderRow();
        return row ? row.querySelector('td:nth-child(3)') : null;
    }

    function getCurrentIdCardElement() {
        const customerCell = getCurrentCustomerCell();
        return customerCell ? customerCell.querySelector('.id-card span') : null;
    }

    function getCurrentModelText() {
        const customerCell = getCurrentCustomerCell();
        if (!customerCell) return '';

        const modelParagraph = Array.from(customerCell.querySelectorAll('p'))
            .find(p => p.textContent.includes('用户机型：'));
        return modelParagraph ? modelParagraph.textContent.trim() : '';
    }

    function togglePanel(show) {
        if (show) {
            if (!lazyInit.appearance) {
                lazyInit.appearance = true;
                initAppearanceSettings();
            }

            initStaffName();

            const idCardEl = getCurrentIdCardElement();
            const idCard = idCardEl ? idCardEl.textContent.trim() : '';

            if (idCard.includes('*') && cachedAge === null) {
                pendingShowPanel = true;
                if (autoAgeEnabled) {
                    if (confirmOkBtn) {
                        confirmOkBtn.click();
                    }
                } else {
                    if (confirmModal) {
                        confirmModal.classList.add('re-modal-visible');
                    }
                }
                return;
            }

            panel.classList.remove('re-panel-hidden');
            panel.classList.add('re-panel-visible');
            panel.classList.remove('re-panel-closing');
            restorePanelPosition();
            initEditableSelects();
            fetchPageData();
            fetchProductData();
            fetchOrderData();
            if (autoFetchEnabled) {
                setTimeout(() => {
                    const newRentDisplay = document.getElementById('re-new-rent');
                    const hasData = newRentDisplay && newRentDisplay.textContent.trim() !== '';
                    if (!hasData) {
                        refreshOrderRiskData();
                    }
                }, 100);
            }
            fetchLinkedPageData();
            if (autoContactQueryEnabled) {
                setTimeout(() => {
                    const contactQueryBtn = document.getElementById('re-contact-query');
                    const phoneDuration = document.getElementById('re-phone-duration');
                    if (contactQueryBtn && phoneDuration && !phoneDuration.textContent.trim()) {
                        contactQueryBtn.click();
                    }
                }, 500);
            }
        } else {
            panel.classList.add('re-panel-closing');
            setTimeout(() => {
                panel.classList.add('re-panel-hidden');
                panel.classList.remove('re-panel-visible');
                panel.classList.remove('re-panel-closing');
            }, 200);
        }
    }

    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', function() {
            if (confirmModal) {
                confirmModal.classList.remove('re-modal-visible');
            }

            const currentRow = getCurrentOrderRow();
            const showIdCardBtn = currentRow ? currentRow.querySelector('button.show-sensitive-data[data-id]') : null;
            if (showIdCardBtn) {
                showIdCardBtn.click();

                setTimeout(() => {
                    const idCardEl = getCurrentIdCardElement();
                    const idCard = idCardEl ? idCardEl.textContent.trim() : '';

                    if (!idCard.includes('*')) {
                        cachedAge = calculateAge(idCard);
                        cachedGender = getGenderFromIdCard(idCard);
                    }

                    if (pendingShowPanel) {
                        pendingShowPanel = false;
                        panel.classList.remove('re-panel-hidden');
                        panel.classList.add('re-panel-visible');
                        panel.classList.remove('re-panel-closing');
                        restorePanelPosition();
                        initStaffName();
                        initEditableSelects();
                        fetchPageData();
                        fetchProductData();
                        fetchOrderData();
                        if (autoFetchEnabled) {
                            setTimeout(() => {
                                const newRentDisplay = document.getElementById('re-new-rent');
                                const hasData = newRentDisplay && newRentDisplay.textContent.trim() !== '';
                                if (!hasData) {
                                    refreshOrderRiskData();
                                }
                            }, 100);
                        }
                        fetchLinkedPageData();
                        if (autoContactQueryEnabled) {
                            setTimeout(() => {
                                const contactQueryBtn = document.getElementById('re-contact-query');
                                const phoneDuration = document.getElementById('re-phone-duration');
                                if (contactQueryBtn && phoneDuration && !phoneDuration.textContent.trim()) {
                                    contactQueryBtn.click();
                                }
                            }, 500);
                        }
                    }
                }, 500);
            } else {
                if (pendingShowPanel) {
                    pendingShowPanel = false;
                    panel.classList.remove('re-panel-hidden');
                    panel.classList.add('re-panel-visible');
                    panel.classList.remove('re-panel-closing');
                    restorePanelPosition();
                    initStaffName();
                    fetchPageData();
                    fetchProductData();
                    fetchOrderData();
                    if (autoFetchEnabled) {
                        setTimeout(() => {
                            const newRentDisplay = document.getElementById('re-new-rent');
                            const hasData = newRentDisplay && newRentDisplay.textContent.trim() !== '';
                            if (!hasData) {
                                refreshOrderRiskData();
                            }
                        }, 100);
                    }
                    fetchLinkedPageData();
                    if (autoContactQueryEnabled) {
                        setTimeout(() => {
                            const contactQueryBtn = document.getElementById('re-contact-query');
                            const phoneDuration = document.getElementById('re-phone-duration');
                            if (contactQueryBtn && phoneDuration && !phoneDuration.textContent.trim()) {
                                contactQueryBtn.click();
                            }
                        }, 500);
                    }
                }
            }
        });
    }

    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', function() {
            if (confirmModal) {
                confirmModal.classList.remove('re-modal-visible');
            }
            if (pendingShowPanel) {
                pendingShowPanel = false;
                panel.classList.remove('re-panel-hidden');
                panel.classList.add('re-panel-visible');
                panel.classList.remove('re-panel-closing');
                restorePanelPosition();
                initEditableSelects();
                fetchPageData();
                fetchProductData();
                fetchOrderData();
                if (autoFetchEnabled) {
                    setTimeout(() => {
                        const newRentDisplay = document.getElementById('re-new-rent');
                        const hasData = newRentDisplay && newRentDisplay.textContent.trim() !== '';
                        if (!hasData) {
                            refreshOrderRiskData();
                        }
                    }, 100);
                }
                fetchLinkedPageData();
                if (autoContactQueryEnabled) {
                    setTimeout(() => {
                        const contactQueryBtn = document.getElementById('re-contact-query');
                        const phoneDuration = document.getElementById('re-phone-duration');
                        if (contactQueryBtn && phoneDuration && !phoneDuration.textContent.trim()) {
                            contactQueryBtn.click();
                        }
                    }, 500);
                }
            }
        });
    }

    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                confirmModal.classList.remove('re-modal-visible');
                if (pendingShowPanel) {
                    pendingShowPanel = false;
                    panel.classList.remove('re-panel-hidden');
                    panel.classList.add('re-panel-visible');
                    panel.classList.remove('re-panel-closing');
                    restorePanelPosition();
                    fetchPageData();
                    fetchProductData();
                    fetchOrderData();
                    if (autoFetchEnabled) {
                        setTimeout(() => {
                            const newRentDisplay = document.getElementById('re-new-rent');
                            const hasData = newRentDisplay && newRentDisplay.textContent.trim() !== '';
                            if (!hasData) {
                                refreshOrderRiskData();
                            }
                        }, 100);
                    }
                    fetchLinkedPageData();
                    if (autoContactQueryEnabled) {
                        setTimeout(() => {
                            const contactQueryBtn = document.getElementById('re-contact-query');
                            const phoneDuration = document.getElementById('re-phone-duration');
                            if (contactQueryBtn && phoneDuration && !phoneDuration.textContent.trim()) {
                                contactQueryBtn.click();
                            }
                        }, 500);
                    }
                }
            }
        });
    }

    function isPanelVisible() {
        return !panel.classList.contains('re-panel-hidden');
    }

    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            togglePanel(!isPanelVisible());
        }
    });

    document.addEventListener('click', (e) => {
        const isClickOnConfirmModal = confirmModal && confirmModal.contains(e.target);
        const manageModal = document.getElementById('re-select-manage-modal');
        const isClickOnManageModal = manageModal && manageModal.contains(e.target);
        const multiSelectManageModal = document.getElementById('re-multi-select-manage-modal');
        const isClickOnMultiSelectManageModal = multiSelectManageModal && multiSelectManageModal.contains(e.target);
        const iframeModal = document.getElementById('re-contact-edit-modal');
        const isClickOnIframeModal = iframeModal && iframeModal.contains(e.target);
        const genericIframeModal = document.getElementById('re-generic-iframe-modal');
        const isClickOnGenericIframeModal = genericIframeModal && genericIframeModal.contains(e.target);
        const modelOrdersModal = document.getElementById('re-model-orders-modal');
        const isClickOnModelOrdersModal = modelOrdersModal && modelOrdersModal.contains(e.target);
        const orderDetailModal = document.getElementById('re-order-detail-modal');
        const isClickOnOrderDetailModal = orderDetailModal && orderDetailModal.contains(e.target);
        const dayEditModal = document.getElementById('re-day-edit-modal');
        const isClickOnDayEditModal = dayEditModal && dayEditModal.contains(e.target);
        const repeatOrdersModal = document.getElementById('re-repeat-orders-modal');
        const isClickOnRepeatOrdersModal = repeatOrdersModal && repeatOrdersModal.contains(e.target);
        const isClickOnLayuiLayer = e.target.closest && (e.target.closest('.layui-layer') || e.target.closest('.layui-layer-shade'));

        if (isPanelVisible() && !panel.contains(e.target) && !isDragging && !isResizing && !justFinishedInteraction && !isClickOnConfirmModal && !isClickOnManageModal && !isClickOnMultiSelectManageModal && !isClickOnIframeModal && !isClickOnGenericIframeModal && !isClickOnModelOrdersModal && !isClickOnOrderDetailModal && !isClickOnDayEditModal && !isClickOnRepeatOrdersModal && !isClickOnLayuiLayer) {
            togglePanel(false);
        }
        if (justFinishedInteraction) {
            justFinishedInteraction = false;
        }
    });

    header.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;

        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        const rect = panel.getBoundingClientRect();
        panelStartX = rect.left;
        panelStartY = rect.top;

        requestAnimationFrame(() => {
            panel.classList.add('re-dragging');
            panel.style.transform = 'none';
            panel.style.left = `${panelStartX}px`;
            panel.style.top = `${panelStartY}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });

        document.body.style.userSelect = 'none';
    });

    resizeHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isResizing = true;
        panel.classList.add('re-dragging');
        e.stopPropagation();
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            let newX = panelStartX + deltaX;
            let newY = panelStartY + deltaY;

            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            panel.style.left = `${newX}px`;
            panel.style.top = `${newY}px`;
        }

        if (isResizing) {
            const rect = panel.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            const newHeight = e.clientY - rect.top;

            if (newWidth >= 800 && newWidth <= window.innerWidth * 0.95) {
                panel.style.width = `${newWidth}px`;
            }
            if (newHeight >= 500 && newHeight <= window.innerHeight * 0.95) {
                panel.style.height = `${newHeight}px`;
            }
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging || isResizing) {
            savePanelPosition();
            panel.classList.remove('re-dragging');
            justFinishedInteraction = true;
        }
        isDragging = false;
        isResizing = false;
        document.body.style.userSelect = '';
    });

    document.addEventListener('mouseleave', () => {
        if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            panel.classList.remove('re-dragging');
            document.body.style.userSelect = '';
        }
    });

    window.addEventListener('blur', () => {
        if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            panel.classList.remove('re-dragging');
            document.body.style.userSelect = '';
        }
    });

    const dragCancelBtn = document.getElementById('re-drag-cancel-btn');
    if (dragCancelBtn) {
        dragCancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            isDragging = false;
            isResizing = false;
            panel.classList.remove('re-dragging');
            document.body.style.userSelect = '';
        });
    }

    const navItems = panel.querySelectorAll('.re-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const pages = ['re-page-data', 're-page-settings', 're-page-history', 're-page-analysis'];
            const rightColumn = document.getElementById('re-right-column');
            const pageType = this.getAttribute('data-page') || 'data';

            pages.forEach(pageId => {
                const pageEl = document.getElementById(pageId);
                if (pageEl) pageEl.style.display = 'none';
            });

            const targetPage = document.getElementById(`re-page-${pageType}`);
            if (targetPage) targetPage.style.display = 'flex';

            if (pageType === 'data') {
                if (rightColumn) rightColumn.style.display = 'flex';
            } else {
                if (rightColumn) rightColumn.style.display = 'none';
            }

            if (pageType === 'history' && !lazyInit.history) {
                lazyInit.history = true;
                renderHistoryRecords();
            } else if (pageType === 'history') {
                renderHistoryRecords();
            }

            if (pageType === 'analysis') {
                if (!lazyInit.analysisEvents) {
                    lazyInit.analysisEvents = true;
                    initAnalysisEvents();
                }
                if (!lazyInit.analysis) {
                    lazyInit.analysis = true;
                    renderAnalysisData();
                    renderModelAnalysis();
                } else {
                    renderAnalysisData();
                    renderModelAnalysis();
                }
            }
        });
    });

    const actionBtns = panel.querySelectorAll('.re-action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    function generateOrderNo() {
        let orderNo = '';
        for (let i = 0; i < 10; i++) {
            orderNo += Math.floor(Math.random() * 10);
        }
        return orderNo;
    }

    const orderNoEl = document.getElementById('re-order-no');
    if (orderNoEl) {
        orderNoEl.textContent = generateOrderNo();
    }

    function getPageDataByXPath(xpath) {
        const result = document.evaluate(xpath, document, null, XPathResult.STRING_TYPE, null);
        return result.stringValue.trim();
    }

    function getElementByXPath(xpath) {
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
    }

    function calculateAge(idCard) {
        if (!idCard || idCard.length < 14) return '';
        const year = parseInt(idCard.substring(6, 10));
        const month = parseInt(idCard.substring(10, 12));
        const day = parseInt(idCard.substring(12, 14));
        const today = new Date();
        const birthDate = new Date(year, month - 1, day);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function getGenderFromIdCard(idCard) {
        if (!idCard || idCard.length < 17) return '';
        const secondLastDigit = parseInt(idCard.charAt(16));
        return secondLastDigit % 2 === 1 ? '男' : '女';
    }

    let cachedAge = null;
    let cachedGender = null;
    let cachedName = '';
    let cachedNewChainLink = null;
    let cachedDiscount = null;
    let cachedShop = '';
    let cachedProductModel = '';

    function readProductModel() {
        try {
            const checkEl = getElementByXPath(CONFIG.XPATH.MAIN_PAGE.valueAddedServiceCheck);
            const checkText = checkEl ? checkEl.textContent.trim() : '';
            const pOffset = checkText.includes('增值服务订单号') ? 1 : 0;
            const modelEl = getElementByXPath(`/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[${2 + pOffset}]`);
            let model = modelEl ? modelEl.textContent.trim() : '';
            return model.replace(/^商品信息[：:]\s*/i, '').trim();
        } catch (e) {
            return '';
        }
    }

    function isRestrictAppStoreModel() {
        return /17\s*pro/i.test(cachedProductModel) && cachedProductModel.includes('二手');
    }

    function fetchPageData() {
        try {
            const checkEl = getElementByXPath(CONFIG.XPATH.MAIN_PAGE.valueAddedServiceCheck);
            const checkText = checkEl ? checkEl.textContent.trim() : '';
            const isValueAddedServiceOrder = checkText.includes('增值服务订单号');

            if (isValueAddedServiceOrder) {
                const newChainLinkEl = getElementByXPath(CONFIG.XPATH.MAIN_PAGE.newChainLink);
                const fullText = newChainLinkEl ? newChainLinkEl.textContent.trim() : '';
                const match = fullText.match(/租机平台:\s*(.+)/);
                if (match && match[1]) {
                    cachedNewChainLink = '新链路：' + match[1].trim();
                }
            } else {
                cachedNewChainLink = null;
            }

            const customerCell = getCurrentCustomerCell();
            cachedProductModel = readProductModel();
            const nameParagraph = customerCell
                ? Array.from(customerCell.querySelectorAll('p')).find(p => p.textContent.includes('姓名：'))
                : null;
            const name = nameParagraph
                ? Array.from(nameParagraph.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent)
                    .join('')
                    .trim()
                : '';
            const idCardEl = getCurrentIdCardElement();
            const idCard = idCardEl ? idCardEl.textContent.trim() : '';
            const model = getCurrentModelText();
            const shopContainerXPath = '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]';

            // 店铺名：匹配"店铺："后面的文本，过滤【】括号内容
            const shopContainerEl = getElementByXPath(shopContainerXPath);
            let shop = '';
            if (shopContainerEl) {
                const fullText = shopContainerEl.textContent.trim();
                const shopMatch = fullText.match(/店铺：\s*(.+)/);
                if (shopMatch && shopMatch[1]) {
                    shop = shopMatch[1].replace(/【[^】]*】/g, '').trim();
                }
            }

            let age = '';
            let gender = '';

            if (idCard.includes('*')) {
                if (cachedAge !== null) {
                    age = cachedAge;
                }
                if (cachedGender !== null) {
                    gender = cachedGender;
                } else {
                    gender = getGenderFromIdCard(idCard.replace(/\*/g, '0'));
                }
            } else {
                age = calculateAge(idCard);
                gender = getGenderFromIdCard(idCard);
                cachedAge = age;
                cachedGender = gender;
            }

            let orderCount = '156';
            try {
                const containerEl = customerCell;
                if (containerEl) {
                    const containerText = containerEl.textContent || containerEl.innerText || '';
                    const match = containerText.match(/待审核订单数[：:]\s*(\d+)/);
                    if (match && match[1]) {
                        orderCount = match[1];
                    }
                }
            } catch (e) {
            }

            function cleanText(text) {
                if (!text) return '';
                let cleaned = text;
                const labelPatterns = [
                    /^姓名[：:]\s*/i,
                    /^用户机型[：:]\s*/i,
                    /^机型[：:]\s*/i,
                    /^店铺[：:]\s*/i,
                    /^年龄[：:]\s*/i,
                    /^性别[：:]\s*/i
                ];
                labelPatterns.forEach(pattern => {
                    cleaned = cleaned.replace(pattern, '');
                });
                const blockWords = ['已收录', '未收录', '已认证', '未认证'];
                blockWords.forEach(word => {
                    cleaned = cleaned.replace(new RegExp(word, 'g'), '');
                });
                return cleaned.trim();
            }

            const cleanName = cleanText(name);
            const cleanModel = cleanText(model);
            const cleanShop = cleanText(shop);

            cachedName = cleanName;
            cachedShop = cleanShop;

            const headerDataEl = panel.querySelector('.re-header-data');
            if (headerDataEl) {
                const orderCountNum = parseInt(orderCount, 10) || 0;
                const ageNum = parseInt(age, 10) || 0;
                let displayText = '【客户办单：' + orderCount + '次】';
                if (cleanName) {
                    if (cachedNewChainLink) {
                        displayText += ' <span class="re-new-chain-link">' + cachedNewChainLink + '</span>';
                    }
                    displayText += ' ' + cleanName;
                    if (gender) {
                        displayText += '（' + gender + '）';
                    }
                }
                if (age) {
                    displayText += ' ' + age + '岁';
                }
                if (cleanModel) {
                    displayText += ' ' + cleanModel;
                }
                if (cleanShop) {
                    displayText += '【' + cleanShop + '】';
                }
                headerDataEl.innerHTML = displayText;

                if (orderCountNum > CONFIG.THRESHOLD.repeatCustomer) {
                    headerDataEl.classList.remove('highlight-gold');
                    void headerDataEl.offsetWidth;
                    headerDataEl.classList.add('highlight-gold');
                }

                if (ageNum >= CONFIG.THRESHOLD.overageAge) {
                    showTooltip('超龄顾客', window.innerWidth / 2, window.innerHeight / 2);
                }
                // 年龄数据填充完成后更新风险面板
                updateRiskPanel();
            }
        } catch (e) {
        }
    }

    async function queryRepeatOrders() {
        // 身份证号获取（参考授权页源码 td .id-card span）
        const idCardEl = getCurrentIdCardElement();
        const idCard = idCardEl ? idCardEl.textContent.trim() : '';

        if (!idCard) {
            alert('未获取到顾客身份证号');
            return;
        }
        if (idCard.includes('*')) {
            alert('身份证号未解密，请先点击原页面「查看」按钮解密后再查询');
            return;
        }

        const listEl = document.getElementById('re-repeat-orders-list');
        const titleEl = document.getElementById('re-repeat-orders-title');
        const modalEl = document.getElementById('re-repeat-orders-modal');
        if (!listEl || !modalEl) return;

        if (titleEl) titleEl.textContent = '历史订单查询中...';
        listEl.innerHTML = '<div class="re-model-order-empty">查询中...</div>';
        modalEl.classList.add('re-modal-visible');

        try {
            const url = 'https://backendproenv.aixzu.com/order/index?out_order_no=&sjmm_out_order_no=&name=&mobile=&id_card='
                + encodeURIComponent(idCard)
                + '&imei=&serial_number=&min_create_time=';
            const resp = await fetch(url, { credentials: 'include' });
            const html = await resp.text();

            const doc = new DOMParser().parseFromString(html, 'text/html');
            const rows = doc.querySelectorAll('#table tbody tr');
            const orders = [];

            rows.forEach(tr => {
                const orderCell = tr.querySelector('td:nth-child(2)');
                if (!orderCell) return;
                const text = orderCell.textContent || '';
                const orderNoMatch = text.match(/订单号[：:]\s*(\d+)/);
                if (!orderNoMatch) return;
                const modelMatch = text.match(/商品信息[：:]\s*([\s\S]*?)(?=IMEI|序列号|来源|$)/);
                const serialMatch = text.match(/序列号[：:]\s*([^\n]+)/);
                const shopMatch = text.match(/店铺[：:]\s*([^\n]+)/);
                const stateMatch = text.match(/状态[：:]\s*([^\n]+)/);
                orders.push({
                    orderNo: orderNoMatch[1],
                    model: modelMatch ? modelMatch[1].trim() : '',
                    serial: serialMatch ? serialMatch[1].trim() : '',
                    shop: shopMatch ? shopMatch[1].trim() : '',
                    state: stateMatch ? stateMatch[1].trim() : ''
                });
            });

            if (titleEl) titleEl.textContent = '历史订单（' + orders.length + '条）';
            listEl.innerHTML = '';

            if (!orders.length) {
                listEl.innerHTML = '<div class="re-model-order-empty">无历史订单</div>';
                return;
            }

            orders.forEach(order => {
                const item = document.createElement('div');
                item.className = 're-model-order-item';
                item.innerHTML = '<div class="re-model-order-info">'
                    + '<div class="re-model-order-name">订单号：' + order.orderNo + '</div>'
                    + '<div class="re-repeat-order-fields">'
                    + '<div>机型：<span class="re-repeat-strong">' + (order.model || '—') + '</span></div>'
                    + '<div>状态：<span class="re-repeat-strong">' + (order.state || '—') + '</span></div>'
                    + '<div>店铺：<span class="re-repeat-strong">' + (order.shop || '—') + '</span></div>'
                    + '<div>序列号：<span class="re-repeat-serial">' + (order.serial || '—') + '</span></div>'
                    + '</div></div>'
                    + '<div class="re-repeat-order-actions">'
                    + '<button class="re-btn-sm re-btn-sm-primary" data-order="' + order.orderNo + '" data-type="auth">面审</button>'
                    + '<button class="re-btn-sm" data-order="' + order.orderNo + '" data-type="bill">账单</button>'
                    + '</div>';
                listEl.appendChild(item);
            });

            listEl.querySelectorAll('button[data-order]').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const orderNo = this.getAttribute('data-order');
                    const type = this.getAttribute('data-type');
                    let targetUrl;
                    if (type === 'auth') {
                        targetUrl = 'https://backendproenv.aixzu.com/app-pre-auth-order/index?operation_type=0&source=-1&rent_plan=-1&business_type=-1&state=-2&staff_id=&video_review_staff_id=0&sort_key=auth_time&name=&out_order_no='
                            + encodeURIComponent(orderNo)
                            + '&mobile=&store_name=&sub_store_name=&salesman=&auth_no=&min_create_time=&max_create_time=';
                    } else {
                        targetUrl = 'https://backendproenv.aixzu.com/bill/index?out_order_no='
                            + encodeURIComponent(orderNo)
                            + '&mobile=&start_time=&end_time=&create_time=&pay_status=-1';
                    }
                    window.open(targetUrl, '_blank');
                });
            });
        } catch (e) {
            if (titleEl) titleEl.textContent = '历史订单查询失败';
            listEl.innerHTML = '<div class="re-model-order-empty">查询失败，请重试</div>';
        }
    }

    (function initRepeatOrdersModal() {
        const modalEl = document.getElementById('re-repeat-orders-modal');
        const closeBtn = document.getElementById('re-repeat-orders-close');
        if (!modalEl) return;
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modalEl.classList.remove('re-modal-visible');
            });
        }
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) {
                modalEl.classList.remove('re-modal-visible');
            }
        });
    })();

    function fetchProductData() {
        try {
            const tdXPath = '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]';
            const tdEl = getElementByXPath(tdXPath);
            const tdText = tdEl ? tdEl.textContent || tdEl.innerText : '';

            function findValueAfterLabel(text, label) {
                const regex = new RegExp(label + '[：:]\\s*([^\\n]+?)(?=\\s*(?:店铺|商品|套餐|机型|最低|办单|逾期|离线|出资|普通|\\n|$))', 'i');
                const match = text.match(regex);
                return match ? match[1].trim() : '';
            }

            function findShopRemark(text, label) {
                const regex = new RegExp(label + '[：:]\\s*([\\s\\S]+?)(?=\\s*店铺历史成交单量)', 'i');
                const match = text.match(regex);
                return match ? match[1].trim() : '';
            }

            function findNumberAfterLabel(text, label) {
                const regex = new RegExp(label + '[：:]\\s*([\\d.]+)', 'i');
                const match = text.match(regex);
                return match ? match[1].trim() : '';
            }

            const checkEl = getElementByXPath(CONFIG.XPATH.MAIN_PAGE.valueAddedServiceCheck);
            const checkText = checkEl ? checkEl.textContent.trim() : '';
            const isValueAddedServiceOrder = checkText.includes('增值服务订单号');
            const pOffset = isValueAddedServiceOrder ? 1 : 0;

            const minDownPaymentXPath = '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[6]/p[5]';
            const packageInfo1XPath = `/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[${3 + pOffset}]`;
            const packageInfo2XPath = `/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[${5 + pOffset}]/span`;
            const shopCategoryXPath = `/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[${8 + pOffset}]`;

            const productModel = readProductModel();
            cachedProductModel = productModel;

            const minDownPaymentEl = getElementByXPath(minDownPaymentXPath);
            const minDownPaymentText = minDownPaymentEl ? minDownPaymentEl.textContent.trim() : '';
            const minDownPaymentMatch = minDownPaymentText.match(/[\d.]+/);
            const minDownPayment = minDownPaymentMatch ? minDownPaymentMatch[0] : '';

            const packageInfo1El = getElementByXPath(packageInfo1XPath);
            const packageInfo1Text = packageInfo1El ? packageInfo1El.textContent.trim() : '';
            const packageInfo1Match = packageInfo1Text.match(/【([^】]+)】/);
            const packageInfo1 = packageInfo1Match ? packageInfo1Match[1] : '';

            const memoryMatch = packageInfo1Text.match(/内存[：:]\s*(\d+)/i);
            const memory = memoryMatch ? memoryMatch[1] : '';

            const packageInfo2El = getElementByXPath(packageInfo2XPath);
            const packageInfo2Text = packageInfo2El ? packageInfo2El.textContent.trim() : '';
            const packageInfo2Match = packageInfo2Text.match(/【([^】]+)】/);
            const packageInfo2 = packageInfo2Match ? packageInfo2Match[1] : '';

            let packageInfo = '';
            if (packageInfo1 && packageInfo2) {
                packageInfo = packageInfo1 + ' ' + packageInfo2;
            } else if (packageInfo1) {
                packageInfo = packageInfo1;
            } else if (packageInfo2) {
                packageInfo = packageInfo2;
            }

            const shopOrderCount = findNumberAfterLabel(tdText, '店铺历史成交单量');

            const shopRemarkText = findShopRemark(tdText, '店铺备注');

            const shopCategoryEl = getElementByXPath(shopCategoryXPath);
            const shopCategoryText = shopCategoryEl ? shopCategoryEl.textContent.trim() : '';
            const shopCategory = shopCategoryText.includes('出资商家') ? '出资商家' : '普通商家';

            const shopOverdue = findNumberAfterLabel(tdText, '店铺逾期率');

            const shopOffline = findNumberAfterLabel(tdText, '店铺离线比例');

            const storeIdMatch = tdText.match(/store_id=(\d+)/);
            const storeId = storeIdMatch ? storeIdMatch[1] : '';

            const productInfoEl = document.getElementById('re-product-info');
            if (productInfoEl && productModel) {
                let displayProductModel = productModel;
                if (memory) {
                    displayProductModel += ' (' + memory + 'GB)';
                }
                productInfoEl.textContent = displayProductModel;
            }

            const minDownPaymentEl2 = document.getElementById('re-min-down-payment');
            if (minDownPaymentEl2 && minDownPayment) {
                minDownPaymentEl2.textContent = '¥' + minDownPayment;
            }

            const packageInfoEl = document.getElementById('re-package-info');
            if (packageInfoEl && packageInfo) {
                packageInfoEl.textContent = packageInfo;
            }

            const expandBusinessTitleEl = document.getElementById('re-expand-business-title');
            const expandTitleTextEl = expandBusinessTitleEl ? expandBusinessTitleEl.querySelector('.re-expand-title-text') : null;
            const expandBadgeEl = document.getElementById('re-expand-restrict-badge');
            let newTitle = '拓展业务';
            if (packageInfo) {
                const len = packageInfo.length;
                if (len >= 3) {
                    const thirdLastChar = packageInfo.charAt(len - 3);
                    const fourthLastChar = packageInfo.charAt(len - 4);
                    if (thirdLastChar === '折' && /\d/.test(fourthLastChar)) {
                        newTitle = '拓展业务（' + fourthLastChar + '折）';
                        cachedDiscount = parseFloat(fourthLastChar) / 10;
                    } else {
                        cachedDiscount = null;
                    }
                } else {
                    cachedDiscount = null;
                }
            } else {
                cachedDiscount = null;
            }
            if (expandTitleTextEl) expandTitleTextEl.textContent = newTitle;
            // 标题右侧胶囊：禁止AppStore / 超龄客户 / 复购客户（复购可点击查询历史订单）
            if (expandBadgeEl) {
                let badges = '';
                if (isRestrictAppStoreModel()) badges += '<span class="re-restrict-appstore">禁止AppStore</span>';
                // 超龄/复购直接按阈值计算（header 胶囊已移除，不再从 headerText 判断）
                const headerText = panel.querySelector('.re-header-data')?.textContent || '';
                const orderCountMatch = headerText.match(/客户办单[：:](\d+)次/);
                const orderCountNum = orderCountMatch ? parseInt(orderCountMatch[1], 10) : 0;
                const ageMatch = headerText.match(/(\d+)岁/);
                const ageNum = ageMatch ? parseInt(ageMatch[1], 10) : 0;
                if (ageNum > CONFIG.THRESHOLD.overageAge) badges += '<span class="re-overage-customer">超龄客户</span>';
                if (orderCountNum >= CONFIG.THRESHOLD.repeatCustomer) badges += '<span class="re-repeat-customer" title="点击查询历史订单">复购客户</span>';
                expandBadgeEl.innerHTML = badges;
                expandBadgeEl.style.display = badges ? 'inline-flex' : 'none';
                expandBadgeEl.style.pointerEvents = 'auto';
                expandBadgeEl.onclick = null;
                expandBadgeEl.onclick = function(e) {
                    if (e.target.classList.contains('re-repeat-customer')) {
                        queryRepeatOrders();
                    }
                };
            }

            updatePricePlaceholder();

            const shopOrderCountEl2 = document.getElementById('re-shop-order-count');
            if (shopOrderCountEl2 && shopOrderCount) {
                shopOrderCountEl2.textContent = shopOrderCount + ' 次';
            }

            const shopRemarkEl2 = document.getElementById('re-shop-remark');
            if (shopRemarkEl2) {
                if (shopRemarkText) {
                    if (shopRemarkText.length > CONFIG.THRESHOLD.shopRemarkTruncate) {
                        shopRemarkEl2.textContent = shopRemarkText.substring(0, CONFIG.THRESHOLD.shopRemarkTruncate) + '...';
                        shopRemarkEl2.classList.add('re-remark-truncated');
                        shopRemarkEl2.setAttribute('data-full-text', shopRemarkText);
                        shopRemarkEl2.setAttribute('title', '点击查看完整内容');
                    } else {
                        shopRemarkEl2.textContent = shopRemarkText;
                        shopRemarkEl2.classList.remove('re-remark-truncated');
                        shopRemarkEl2.removeAttribute('data-full-text');
                        shopRemarkEl2.removeAttribute('title');
                    }
                } else {
                    shopRemarkEl2.textContent = '暂无备注';
                    shopRemarkEl2.classList.remove('re-remark-truncated');
                    shopRemarkEl2.removeAttribute('data-full-text');
                    shopRemarkEl2.removeAttribute('title');
                }
            }

            const shopCategoryEl2 = document.getElementById('re-shop-category');
            if (shopCategoryEl2) {
                shopCategoryEl2.textContent = shopCategory;
                if (shopCategory === '出资商家') {
                    shopCategoryEl2.classList.add('re-value-danger');
                } else {
                    shopCategoryEl2.classList.remove('re-value-danger');
                }
            }

            const shopOverdueEl = document.getElementById('re-shop-overdue');
            if (shopOverdueEl && shopOverdue) {
                shopOverdueEl.textContent = shopOverdue + '%';
                const overdueValue = parseFloat(shopOverdue);
                shopOverdueEl.classList.remove('re-value-success', 're-value-warning', 're-value-danger');
                if (overdueValue > 6) {
                    shopOverdueEl.classList.add('re-value-danger');
                } else if (overdueValue > 3) {
                    shopOverdueEl.classList.add('re-value-warning');
                } else {
                    shopOverdueEl.classList.add('re-value-success');
                }

                shopOverdueEl.onclick = function() {
                    const tdEl = getElementByXPath('/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]');
                    if (tdEl) {
                        const allP = tdEl.querySelectorAll('p');
                        for (const p of allP) {
                            if (p.textContent.includes('店铺逾期率')) {
                                const viewLink = p.querySelector('a');
                                if (viewLink && viewLink.textContent.trim() === '查看') {
                                    openLayerLink(viewLink);
                                    return;
                                }
                            }
                        }
                    }
                };
            }

            const shopOfflineEl2 = document.getElementById('re-shop-offline');
            if (shopOfflineEl2 && shopOffline) {
                shopOfflineEl2.textContent = shopOffline + '%';
                const offlineValue = parseFloat(shopOffline);
                shopOfflineEl2.classList.remove('re-value-success', 're-value-warning', 're-value-danger');
                if (offlineValue > 7) {
                    shopOfflineEl2.classList.add('re-value-danger');
                } else if (offlineValue > 4) {
                    shopOfflineEl2.classList.add('re-value-warning');
                } else {
                    shopOfflineEl2.classList.add('re-value-success');
                }

                shopOfflineEl2.onclick = function() {
                    const tdEl = getElementByXPath('/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]');
                    if (tdEl) {
                        const childNodes = tdEl.childNodes;
                        for (let i = 0; i < childNodes.length; i++) {
                            const node = childNodes[i];
                            if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                                if (node.textContent && node.textContent.includes('店铺离线比例')) {
                                    for (let j = i + 1; j < childNodes.length; j++) {
                                        const nextNode = childNodes[j];
                                        if (nextNode.nodeType === Node.ELEMENT_NODE && nextNode.tagName === 'A' && nextNode.textContent.trim() === '查看') {
                                            openLayerLink(nextNode);
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            const deviceModelEl = document.getElementById('re-device-model');
            if (deviceModelEl && productModel) {
                let displayProductModel = productModel;
                if (memory) {
                    displayProductModel += ' (' + memory + 'GB)';
                }
                deviceModelEl.textContent = displayProductModel;
            }

            fetchRegulatoryRecyclingPrice().then(function(price) {
                const devicePriceEl = document.getElementById('re-device-price');
                if (devicePriceEl && price) {
                    devicePriceEl.textContent = '¥' + price;
                    devicePriceEl.style.color = '#38a169';
                    devicePriceEl.style.fontWeight = '500';
                }
            }).catch(function() {
            });
            // 店铺数据填充完成后更新风险面板
            updateRiskPanel();
        } catch (e) {
        }
    }

    function fetchRegulatoryRecyclingPrice() {
        return new Promise((resolve, reject) => {
            const externalOutOrderNoEl = document.querySelector('a[data-external_out_order_no]');
            if (!externalOutOrderNoEl) {
                reject(new Error('未找到订单号元素'));
                return;
            }
            const externalOutOrderNo = externalOutOrderNoEl.getAttribute('data-external_out_order_no');
            if (!externalOutOrderNo) {
                reject(new Error('订单号为空'));
                return;
            }

            const baseUrl = window.location.origin + '/';
            const url = `${baseUrl}order-audit/show-sensitive-data?external_out_order_no=${encodeURIComponent(externalOutOrderNo)}`;

            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.hasOwnProperty('regulatory_recycling_price')) {
                                resolve(response.regulatory_recycling_price);
                            } else {
                                reject(new Error('响应数据中未找到监管回收价格字段'));
                            }
                        } catch (parseError) {
                            reject(new Error('解析响应数据失败'));
                        }
                    } else {
                        reject(new Error(`请求失败，状态码: ${xhr.status}`));
                    }
                }
            };

            xhr.onerror = function() {
                reject(new Error('网络请求失败'));
            };

            xhr.send();
        });
    }

    function fetchOrderData() {
        try {
            const orderNoXPath = '/html/body/div[2]/div[2]/form/table/tbody/tr[1]/td[4]/p[1]/text()';
            const orderNoText = getPageDataByXPath(orderNoXPath);
            const orderNoMatch = orderNoText.match(/\d+/);
            const orderNo = orderNoMatch ? orderNoMatch[0] : '';

            const orderNoEl = document.getElementById('re-order-no');
            if (orderNoEl && orderNo) {
                orderNoEl.textContent = orderNo;
            }
        } catch (e) {
        }
    }

    function refreshOrderRiskData() {
        const orderNoEl = document.getElementById('re-order-no');
        const orderNo = orderNoEl ? orderNoEl.textContent.trim() : '';

        if (!orderNo) {
            return;
        }

        const refreshIcon = document.getElementById('re-order-refresh');
        if (refreshIcon) {
            refreshIcon.style.animation = 're-spin 1s linear infinite';
        }

        const newRentDisplay = document.getElementById('re-new-rent');
        const todayApplyDisplay = document.getElementById('re-today-apply');
        const day7ApplyDisplay = document.getElementById('re-7day-apply');
        const day30ApplyDisplay = document.getElementById('re-30day-apply');
        const riskLevelDisplay = document.getElementById('re-risk-level');
        const v4RiskDisplay = document.getElementById('re-v4-risk');
        const legalStatusDisplay = document.getElementById('re-legal-status');

        if (newRentDisplay) newRentDisplay.textContent = '';
        if (todayApplyDisplay) todayApplyDisplay.textContent = '';
        if (day7ApplyDisplay) day7ApplyDisplay.textContent = '';
        if (day30ApplyDisplay) day30ApplyDisplay.textContent = '';
        if (riskLevelDisplay) riskLevelDisplay.textContent = '';
        if (v4RiskDisplay) v4RiskDisplay.textContent = '';
        if (legalStatusDisplay) legalStatusDisplay.textContent = '';

        const multiRentUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.multiRentRisk + '?out_order_no=' + orderNo;
        const v4RiskUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.v4Risk + '?out_order_no=' + orderNo;
        const legalUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.legalStatus + '?out_order_no=' + orderNo;

        if (typeof GM_xmlhttpRequest === 'undefined') {
            if (refreshIcon) refreshIcon.style.animation = '';
            return;
        }

        let completedRequests = 0;
        const totalRequests = 3;

        function checkAllCompleted() {
            completedRequests++;
            if (completedRequests >= totalRequests) {
                if (refreshIcon) refreshIcon.style.animation = '';
                updateRiskPanel();
            }
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: multiRentUrl,
            onload: function(response) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');

                    const newRentEl = doc.evaluate('/html/body/div[2]/div/table/tbody/tr[4]/td[2]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    const newRent = newRentEl ? newRentEl.textContent.trim() : '';

                    const todayApplyEl = doc.evaluate('/html/body/div[2]/div/table/tbody/tr[5]/td[2]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    const todayApply = todayApplyEl ? todayApplyEl.textContent.trim() : '';

                    const day7ApplyEl = doc.evaluate('/html/body/div[2]/div/table/tbody/tr[6]/td[2]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    const day7Apply = day7ApplyEl ? day7ApplyEl.textContent.trim() : '';

                    const day30ApplyEl = doc.evaluate('/html/body/div[2]/div/table/tbody/tr[7]/td[2]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    const day30Apply = day30ApplyEl ? day30ApplyEl.textContent.trim() : '';

                    const riskLevelEl = doc.evaluate('/html/body/div[2]/div/table/tbody/tr[8]/td[2]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    const riskLevel = riskLevelEl ? riskLevelEl.textContent.trim() : '';

                    if (newRentDisplay && newRent) {
                        newRentDisplay.textContent = newRent;
                        newRentDisplay.classList.remove('re-value-success', 're-value-warning', 're-value-danger');
                        if (newRent === '无共租风险') {
                        } else {
                            newRentDisplay.classList.add('re-value-danger');
                        }
                    }

                    if (todayApplyDisplay && todayApply) {
                        todayApplyDisplay.textContent = todayApply;
                    }

                    if (day7ApplyDisplay && day7Apply) {
                        day7ApplyDisplay.textContent = day7Apply;
                    }

                    if (day30ApplyDisplay && day30Apply) {
                        day30ApplyDisplay.textContent = day30Apply;
                    }

                    if (riskLevelDisplay && riskLevel) {
                        riskLevelDisplay.textContent = riskLevel;
                        riskLevelDisplay.classList.remove('re-value-success', 're-value-warning', 're-value-danger');
                        if (riskLevel.includes('低') || riskLevel.includes('正常')) {
                            riskLevelDisplay.classList.add('re-value-success');
                        } else if (riskLevel.includes('中')) {
                            riskLevelDisplay.classList.add('re-value-warning');
                        } else if (riskLevel.includes('高')) {
                            riskLevelDisplay.classList.add('re-value-danger');
                        }
                    }

                } catch (e) {
                }
                checkAllCompleted();
            },
            onerror: function(error) {
                checkAllCompleted();
            }
        });

        GM_xmlhttpRequest({
            method: 'GET',
            url: v4RiskUrl,
            onload: function(response) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');

                    const v4RiskEl = doc.evaluate('/html/body/div[2]/div/form/table/tbody/tr[2]/td[2]/span[1]/text()', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    const v4Risk = v4RiskEl ? v4RiskEl.textContent.trim() : '';

                    if (v4RiskDisplay && v4Risk) {
                        v4RiskDisplay.textContent = v4Risk;
                        v4RiskDisplay.classList.remove('re-value-success', 're-value-warning', 're-value-danger');
                        if (v4Risk.includes('低') || v4Risk.includes('正常')) {
                            v4RiskDisplay.classList.add('re-value-success');
                        } else if (v4Risk.includes('中')) {
                            v4RiskDisplay.classList.add('re-value-warning');
                        } else if (v4Risk.includes('高')) {
                            v4RiskDisplay.classList.add('re-value-danger');
                        }
                    }

                } catch (e) {
                }
                checkAllCompleted();
            },
            onerror: function(error) {
                checkAllCompleted();
            }
        });

        GM_xmlhttpRequest({
            method: 'GET',
            url: legalUrl,
            onload: function(response) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');

                    const legalStatusEl = doc.evaluate('/html/body/div[2]/table[1]/tbody/tr/td[4]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    const legalStatus = legalStatusEl ? legalStatusEl.textContent.trim() : '';

                    if (legalStatusDisplay && legalStatus) {
                        legalStatusDisplay.textContent = legalStatus;
                        legalStatusDisplay.classList.remove('re-value-success', 're-value-warning', 're-value-danger', 're-value-info');
                        if (legalStatus === '没有司法风险人员') {
                        } else {
                            legalStatusDisplay.classList.add('re-value-danger');
                        }

                        const orderNoEl = document.getElementById('re-order-no');
                        const orderNo = orderNoEl ? orderNoEl.textContent.trim() : '';

                        legalStatusDisplay.onclick = function() {
                            if (orderNo) {
                                const legalDetailUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.legalStatus + '?out_order_no=' + orderNo;
                                openIframeModal(legalDetailUrl, '法律状态详情');
                            }
                        };
                    }

                } catch (e) {
                }
                checkAllCompleted();
            },
            onerror: function(error) {
                checkAllCompleted();
            }
        });
    }

    function fetchLinkedPageData() {
        try {
            const linkXPath = '/html/body/div[2]/div[2]/form/table/tbody/tr/td[1]/a[1]';
            const linkEl = getElementByXPath(linkXPath);
            const href = linkEl ? linkEl.getAttribute('href') : '';

            if (!href) {
                return;
            }

            if (typeof GM_xmlhttpRequest === 'undefined') {
                return;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: href,
                onload: function(response) {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        // 通过匹配表头字段获取手机成本和指导价
                        let phoneCost = '';
                        let guidePrice = '';
                        const feeH3s = doc.querySelectorAll('h3');
                        for (let i = 0; i < feeH3s.length; i++) {
                            if (feeH3s[i].textContent.includes('费用信息')) {
                                let feeTable = feeH3s[i].nextElementSibling;
                                while (feeTable && feeTable.tagName !== 'TABLE') {
                                    feeTable = feeTable.nextElementSibling;
                                }
                                if (feeTable) {
                                    const headers = feeTable.querySelectorAll('thead tr th');
                                    const headerTexts = Array.from(headers).map(th => th.textContent.trim());
                                    const phoneCostIdx = headerTexts.findIndex(t => t === '商品售价');
                                    const guidePriceIdx = headerTexts.findIndex(t => t === '指导价');
                                    const tbodyRow = feeTable.querySelector('tbody tr');
                                    if (tbodyRow) {
                                        const tds = tbodyRow.querySelectorAll('td');
                                        if (phoneCostIdx >= 0 && tds[phoneCostIdx]) {
                                            phoneCost = tds[phoneCostIdx].textContent.trim();
                                        }
                                        if (guidePriceIdx >= 0 && tds[guidePriceIdx]) {
                                            guidePrice = tds[guidePriceIdx].textContent.trim();
                                        }
                                    }
                                }
                                break;
                            }
                        }

                        let contactName = '';
                        let contactRelation = '';
                        let contactPhone = '';
                        let memberOrderAmount = '';

                        const allH3 = doc.querySelectorAll('h3');
                        for (let i = 0; i < allH3.length; i++) {
                            const h3Text = allH3[i].textContent.trim();
                            if (h3Text.includes('紧急联系人')) {
                                const nextTable = allH3[i].nextElementSibling;
                                if (nextTable && nextTable.tagName === 'TABLE') {
                                    const firstRow = nextTable.querySelector('tbody tr');
                                    if (firstRow) {
                                        const tds = firstRow.querySelectorAll('td');
                                        if (tds.length >= 3) {
                                            contactName = tds[0].textContent.trim();
                                            contactRelation = tds[1].textContent.trim();
                                            contactPhone = tds[2].textContent.trim();
                                        }
                                    }
                                }
                            }

                            if (h3Text.includes('客户信息')) {
                                const nextTable = allH3[i].nextElementSibling;
                                if (nextTable && nextTable.tagName === 'TABLE') {
                                    const ths = nextTable.querySelectorAll('thead tr th');
                                    let memberIndex = -1;
                                    ths.forEach((th, idx) => {
                                        if (th.textContent.trim() === '会员订单金额') {
                                            memberIndex = idx;
                                        }
                                    });
                                    if (memberIndex > -1) {
                                        const firstRow = nextTable.querySelector('tbody tr');
                                        if (firstRow) {
                                            const tds = firstRow.querySelectorAll('td');
                                            if (tds[memberIndex]) {
                                                memberOrderAmount = tds[memberIndex].textContent.trim();
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        const phoneCostInput = document.getElementById('re-phone-cost');
                        const guidePriceInput = document.getElementById('re-guide-price');
                        const phoneCostDiffContainer = document.getElementById('re-phone-cost-diff');

                        const phoneCostNum = parseFloat(phoneCost) || 0;
                        const guidePriceNum = parseFloat(guidePrice) || 0;

                        if (phoneCostInput && phoneCost) {
                            phoneCostInput.value = phoneCost;
                            updatePricePlaceholder();
                        }

                        if (phoneCostDiffContainer) {
                            phoneCostDiffContainer.innerHTML = '';
                            if (phoneCostNum > guidePriceNum && guidePriceNum > 0) {
                                const diff = (phoneCostNum - guidePriceNum).toFixed(2);
                                const percent = ((diff / guidePriceNum) * 100).toFixed(1);
                                const diffSpan = document.createElement('span');
                                diffSpan.className = 're-price-diff re-price-diff-high';
                                diffSpan.textContent = '超' + diff + '(' + percent + '%)';
                                phoneCostDiffContainer.appendChild(diffSpan);

                                if (phoneCostNum > guidePriceNum + 500 || parseFloat(percent) > 10) {
                                    showTooltip('超指导价', window.innerWidth / 2, window.innerHeight / 2);
                                }
                            } else if (phoneCostNum < guidePriceNum && guidePriceNum > 0) {
                                const diff = (guidePriceNum - phoneCostNum).toFixed(2);
                                const percent = ((diff / guidePriceNum) * 100).toFixed(1);
                                const diffSpan = document.createElement('span');
                                diffSpan.className = 're-price-diff re-price-diff-low';
                                diffSpan.textContent = '低' + diff + '(' + percent + '%)';
                                phoneCostDiffContainer.appendChild(diffSpan);
                            }
                        }

                        if (guidePriceInput && guidePrice) {
                            guidePriceInput.value = '¥' + guidePrice;
                        }

                        const contactNameEl2 = document.getElementById('re-contact-name');
                        if (contactNameEl2) {
                            contactNameEl2.textContent = contactName || '张三';
                        }

                        const contactRelationEl2 = document.getElementById('re-contact-relation');
                        if (contactRelationEl2) {
                            contactRelationEl2.textContent = contactRelation || '本人';
                        }

                        const contactPhoneEl2 = document.getElementById('re-contact-phone');
                        if (contactPhoneEl2) {
                            contactPhoneEl2.textContent = contactPhone || '【无参数】';
                            contactPhoneEl2.classList.remove('re-phone-alert');
                        }

                        const memberAmountEl = document.getElementById('re-member-amount');
                        if (memberAmountEl) {
                            if (memberOrderAmount) {
                                memberAmountEl.textContent = '会员订单 ' + memberOrderAmount;
                                memberAmountEl.style.display = '';
                            } else {
                                memberAmountEl.style.display = 'none';
                            }
                        }

                        // 价格数据填充完成后更新风险面板
                        updateRiskPanel();

                    } catch (e) {
                    }
                },
                onerror: function(error) {
                }
            });
        } catch (e) {
        }
    }

    fetchPageData();
    fetchProductData();
    fetchOrderData();
    fetchLinkedPageData();

    const orderRefreshBtn = document.getElementById('re-order-refresh');
    if (orderRefreshBtn) {
        orderRefreshBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            refreshOrderRiskData();
        });
    }

    const previewBox = document.querySelector('.re-preview-box');
    if (previewBox) {
        previewBox.addEventListener('click', function(e) {
            e.stopPropagation();
            if (this.classList.contains('empty')) {
                return;
            }
            const previewContentEl = document.getElementById('re-preview-content');
            const previewContent = previewContentEl ? previewContentEl.textContent.trim() : '';

            if (!previewContent) {
                return;
            }

            navigator.clipboard.writeText(previewContent).then(() => {
                showSuccessToast('已复制到剪贴板');
            }).catch(() => {
                showTooltip('复制失败，请手动复制', window.innerWidth / 2, window.innerHeight / 2);
            });
        });
    }

    const shopRemarkValue = document.getElementById('re-shop-remark');
    if (shopRemarkValue) {
        shopRemarkValue.addEventListener('click', function() {
            if (this.classList.contains('re-remark-truncated')) {
                const fullText = this.getAttribute('data-full-text');
                if (fullText) {
                    showTooltip(fullText, window.innerWidth / 2, window.innerHeight / 2);
                }
            }
        });
    }

    const auditResultInput = document.getElementById('re-audit-result');

    // 输入框聚焦时显示价格建议
    let activeSuggestMenu = null;

    function getPriceSuggestions() {
        const suggestions = [];

        const minPrice = getMinPrice();
        if (minPrice && minPrice > 0) {
            suggestions.push({ label: '最低结果', value: String(minPrice) });
        }

        const minDownPaymentEl = document.getElementById('re-min-down-payment');
        if (minDownPaymentEl) {
            const text = minDownPaymentEl.textContent.replace('¥', '').replace(/,/g, '').trim();
            if (text && text !== '0' && text !== '0.00') {
                suggestions.push({ label: '最低首付', value: minDownPaymentEl.textContent.replace('¥', '').trim() });
            }
        }

        const v4RiskEl = document.getElementById('re-v4-risk');
        if (v4RiskEl) {
            const text = v4RiskEl.textContent.trim();
            const priceMatch = text.match(/[\d,]+/);
            if (priceMatch) {
                suggestions.push({ label: '初审结果', value: priceMatch[0] });
            }
        }
        return suggestions;
    }

    function showPriceSuggest(inputEl) {
        hidePriceSuggest();
        const suggestions = getPriceSuggestions();
        if (suggestions.length === 0) return;

        const menu = document.createElement('div');
        menu.className = 're-price-suggest';

        suggestions.forEach(s => {
            const item = document.createElement('div');
            item.className = 're-price-suggest-item';
            item.innerHTML = `<span>${s.value}</span><span class="re-price-suggest-label">${s.label}</span>`;
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                inputEl.value = s.value;
                inputEl.focus();
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                hidePriceSuggest();
            });
            menu.appendChild(item);
        });

        const parentInline = inputEl.closest('.re-data-form-inline');
        if (parentInline) {
            parentInline.style.position = 'relative';
            parentInline.appendChild(menu);
        }

        activeSuggestMenu = menu;
        menu.classList.add('re-suggest-visible');
    }

    function hidePriceSuggest() {
        if (activeSuggestMenu) {
            activeSuggestMenu.remove();
            activeSuggestMenu = null;
        }
    }

    if (auditResultInput) {
        auditResultInput.addEventListener('focus', function() {
            showPriceSuggest(this);
        });
        auditResultInput.addEventListener('blur', function() {
            setTimeout(hidePriceSuggest, 150);
        });
    }

    const expandPriceInput = document.getElementById('re-expand-result');
    if (expandPriceInput) {
        expandPriceInput.addEventListener('focus', function() {
            showPriceSuggest(this);
        });
        expandPriceInput.addEventListener('blur', function() {
            setTimeout(hidePriceSuggest, 150);
        });
    }

    function updatePricePlaceholder() {
        const auditResultInput = document.getElementById('re-audit-result');
        const expandResultInput = document.getElementById('re-expand-result');
        const phoneCostEl = document.getElementById('re-phone-cost');
        const minDownPaymentEl = document.getElementById('re-min-down-payment');

        if (!phoneCostEl || cachedDiscount === null) {
            if (auditResultInput) auditResultInput.placeholder = '请输入';
            if (expandResultInput) expandResultInput.placeholder = '请输入';
            return;
        }

        const costText = phoneCostEl.value.replace('¥', '').replace(/,/g, '').trim();
        const cost = parseFloat(costText);
        if (isNaN(cost)) {
            if (auditResultInput) auditResultInput.placeholder = '请输入';
            if (expandResultInput) expandResultInput.placeholder = '请输入';
            return;
        }

        const calculatedMinPrice = Math.round(cost * cachedDiscount + 50);

        let minDownPayment = 0;
        if (minDownPaymentEl) {
            const downPaymentText = minDownPaymentEl.textContent.replace('¥', '').replace(/,/g, '').trim();
            minDownPayment = parseFloat(downPaymentText) || 0;
        }

        const memberAmountEl = document.getElementById('re-member-amount');
        let memberAmount = 0;
        if (memberAmountEl && memberAmountEl.style.display !== 'none') {
            const memberText = memberAmountEl.textContent.replace(/[^0-9.]/g, '').trim();
            memberAmount = parseFloat(memberText) || 0;
        }

        let finalMinPrice;
        if (cachedDiscount === 0.5 || cachedDiscount === 0.6) {
            finalMinPrice = minDownPayment;
        } else if (memberAmount > 0) {
            finalMinPrice = Math.round(minDownPayment + memberAmount);
        } else {
            finalMinPrice = Math.max(calculatedMinPrice, minDownPayment);
        }
        const placeholderText = '最低结果：¥' + finalMinPrice;

        if (auditResultInput) auditResultInput.placeholder = placeholderText;
        if (expandResultInput) expandResultInput.placeholder = placeholderText;
    }

    function getMinPrice() {
        const phoneCostEl = document.getElementById('re-phone-cost');
        const minDownPaymentEl = document.getElementById('re-min-down-payment');

        if (!phoneCostEl || cachedDiscount === null) return null;

        const costText = phoneCostEl.value.replace('¥', '').replace(/,/g, '').trim();
        const cost = parseFloat(costText);
        if (isNaN(cost) || isNaN(cachedDiscount)) return null;

        const calculatedMinPrice = Math.round(cost * cachedDiscount + 50);

        let minDownPayment = 0;
        if (minDownPaymentEl) {
            const downPaymentText = minDownPaymentEl.textContent.replace('¥', '').replace(/,/g, '').trim();
            minDownPayment = parseFloat(downPaymentText) || 0;
        }

        const memberAmountEl = document.getElementById('re-member-amount');
        let memberAmount = 0;
        if (memberAmountEl && memberAmountEl.style.display !== 'none') {
            const memberText = memberAmountEl.textContent.replace(/[^0-9.]/g, '').trim();
            memberAmount = parseFloat(memberText) || 0;
        }

        if (cachedDiscount === 0.5 || cachedDiscount === 0.6) {
            return minDownPayment;
        } else if (memberAmount > 0) {
            return Math.round(minDownPayment + memberAmount);
        } else {
            return Math.max(calculatedMinPrice, minDownPayment);
        }
    }

    function validatePrice(input, priceName) {
        let inputValue = parseFloat(input.value.replace(/,/g, ''));
        if (isNaN(inputValue)) return true;

        const isNewChainLink = cachedNewChainLink !== null;

        if (isNewChainLink) {
            const hasDecimal = input.value.includes('.') || !Number.isInteger(inputValue);
            if (hasDecimal) {
                inputValue = Math.ceil(inputValue);
                input.value = inputValue;
            }
        }

        const minPrice = getMinPrice();
        if (minPrice === null) return true;

        if (inputValue < minPrice) {
            if (isNewChainLink) {
                alert('最低售价为：¥' + minPrice + '，请重新输入！');
                input.value = '';
                input.focus();
                return false;
            } else {
                const confirmed = confirm('最低售价为：¥' + minPrice + '，您确定要填入此价格吗？');
                if (!confirmed) {
                    input.value = '';
                    input.focus();
                    return false;
                }
            }
        }
        return true;
    }

    if (auditResultInput) {
        auditResultInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                validatePrice(this, '审核价格');
            }
        });
    }

    const expandResultInput = document.getElementById('re-expand-result');
    if (expandResultInput) {
        expandResultInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                validatePrice(this, '拓展价格');
            }
        });
    }

    const oldDeviceSwitch = document.getElementById('re-old-device');
    const oldDeviceContent = oldDeviceSwitch?.closest('.re-form-inline')?.querySelector('.re-switch-content');
    const oldDeviceSelect = oldDeviceSwitch?.closest('.re-form-inline')?.querySelector('.re-old-device-select');
    if (oldDeviceSwitch && oldDeviceContent && oldDeviceSelect) {
        oldDeviceSwitch.addEventListener('change', function() {
            if (this.checked) {
                oldDeviceContent.classList.add('re-visible');
                oldDeviceSelect.style.display = 'none';
            } else {
                oldDeviceContent.classList.remove('re-visible');
                oldDeviceSelect.style.display = 'block';
            }
        });
    }

    const workOptionSwitch = document.getElementById('re-work-option');
    const workOptionContent = workOptionSwitch?.closest('.re-form-inline')?.querySelector('.re-switch-content');
    if (workOptionSwitch && workOptionContent) {
        if (workOptionSwitch.checked) {
            workOptionContent.classList.add('re-visible');
        }
        workOptionSwitch.addEventListener('change', function() {
            if (this.checked) {
                workOptionContent.classList.add('re-visible');
            } else {
                workOptionContent.classList.remove('re-visible');
            }
        });
    }

    const rentExpandSwitch = document.getElementById('re-rent-expand');
    const rentExpandSelect = rentExpandSwitch?.closest('.re-data-form-inline')?.querySelector('.re-rent-expand-select');
    const expandResultRow = rentExpandSwitch?.closest('.re-data-form')?.querySelector('.re-expand-result-row');

    function openIframeModal(url, title) {
        let iframeModal = document.getElementById('re-generic-iframe-modal');
        if (!iframeModal) {
            iframeModal = document.createElement('div');
            iframeModal.id = 're-generic-iframe-modal';
            iframeModal.className = 're-iframe-modal';
            iframeModal.innerHTML = `
                <div class="re-iframe-modal-content">
                    <div class="re-iframe-modal-header">
                        <span class="re-iframe-modal-title">详情</span>
                        <button class="re-iframe-modal-close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="re-iframe-modal-body">
                        <iframe id="re-generic-iframe" frameborder="0"></iframe>
                    </div>
                </div>
            `;
            document.body.appendChild(iframeModal);

            iframeModal.querySelector('.re-iframe-modal-close').addEventListener('click', function() {
                iframeModal.classList.remove('show');
            });

            iframeModal.addEventListener('click', function(e) {
                if (e.target === iframeModal) {
                    iframeModal.classList.remove('show');
                }
            });
        }

        const titleEl = iframeModal.querySelector('.re-iframe-modal-title');
        if (titleEl && title) {
            titleEl.textContent = title;
        }

        const iframe = document.getElementById('re-generic-iframe');
        if (iframe && url) {
            iframe.src = url;
        }
        iframeModal.classList.add('show');
    }

    function showTooltip(message, x, y) {
        let tooltip = document.getElementById('re-expand-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 're-expand-tooltip';
            tooltip.className = 're-tooltip';
            document.body.appendChild(tooltip);
        }
        tooltip.textContent = message;
        tooltip.style.left = x + 'px';
        tooltip.style.top = (y + 20) + 'px';
        tooltip.classList.add('re-tooltip-visible');
        setTimeout(() => {
            tooltip.classList.remove('re-tooltip-visible');
        }, CONFIG.TIME.toastDuration);
    }

    if (rentExpandSwitch && rentExpandSelect && expandResultRow) {
        rentExpandSwitch.addEventListener('change', function(e) {
            if (this.checked) {
                rentExpandSelect.classList.add('re-visible');
                expandResultRow.classList.add('re-visible');
                // 默认写入并选中拓展类型（17Pro/17ProMax 二手机型特殊处理）
                const defaultExpandType = isRestrictAppStoreModel() ? '禁止AppStore+限制ID：' : '方案二：';
                if (!Array.from(rentExpandSelect.options).some(o => o.value === defaultExpandType)) {
                    const opt = document.createElement('option');
                    opt.textContent = defaultExpandType;
                    rentExpandSelect.appendChild(opt);
                }
                rentExpandSelect.value = defaultExpandType;
                rentExpandSelect.dispatchEvent(new Event('change'));
            } else {
                rentExpandSelect.classList.remove('re-visible');
                expandResultRow.classList.remove('re-visible');
            }
        });
    }

    const auditResultInput2 = document.getElementById('re-audit-result');
    const productInfoValue = document.getElementById('re-product-info');
    const minDownPaymentValue2 = document.getElementById('re-min-down-payment');
    if (auditResultInput2 && productInfoValue && minDownPaymentValue2) {
        auditResultInput2.addEventListener('focus', function() {
            productInfoValue.classList.add('re-highlight');
            minDownPaymentValue2.classList.add('re-highlight');
            setTimeout(() => {
                productInfoValue.classList.remove('re-highlight');
                minDownPaymentValue2.classList.remove('re-highlight');
            }, CONFIG.TIME.processCompleteDelay);
        });
    }

    const orderResultSelect = document.getElementById('re-order-result');
    const expandTypeSelect = document.getElementById('re-expand-type');
    const expandOrderResultSelect = document.getElementById('re-expand-order-result');
    const specialRemarkInput = document.getElementById('re-special-remark');
    const previewMain = document.getElementById('re-preview-main');
    const previewExpand = document.getElementById('re-preview-expand');
    const previewRemark = document.getElementById('re-preview-remark');

    function updatePreview() {
        const auditText = auditResultInput2?.value || '';
        const orderResult = orderResultSelect?.value || '';
        const expandChecked = rentExpandSwitch?.checked || false;
        const expandType = expandTypeSelect?.value || '';
        const expandResult = expandResultInput?.value || '';
        const expandOrderResult = expandOrderResultSelect?.value || '';
        const specialRemark = specialRemarkInput?.value || '';

        const previewContentEl = document.getElementById('re-preview-content');
        const previewContent = previewContentEl ? previewContentEl.textContent.trim() : '';
        const staffRemarkBtn = document.getElementById('re-btn-staff-remark');
        const previewBox = document.querySelector('.re-preview-box');

        if (staffRemarkBtn) {
            if (!previewContent || previewContent === '请先填 审核价格' || previewContent === '订单取消') {
                staffRemarkBtn.classList.add('disabled');
                staffRemarkBtn.setAttribute('disabled', 'true');
            } else {
                staffRemarkBtn.classList.remove('disabled');
                staffRemarkBtn.removeAttribute('disabled');
            }
        }

        if (previewMain) {
            if (orderResult === '取消') {
                if (cachedName) {
                    previewMain.textContent = cachedName + '：订单取消';
                } else {
                    previewMain.textContent = '订单取消';
                }
            } else if (auditText.trim() === '') {
                previewMain.innerHTML = '<span class="re-preview-placeholder">请先填 审核价格</span>';
            } else {
                let previewText = '';
                const mainLabel = isRestrictAppStoreModel() ? '禁止AppStore：' : '方案一：';
                if (cachedName) {
                    previewText = cachedName + '：' + mainLabel + auditText + ' ' + orderResult;
                } else {
                    previewText = mainLabel + auditText + ' ' + orderResult;
                }
                previewMain.textContent = previewText;
            }
        }

        if (previewExpand) {
            if (expandChecked && expandResult) {
                const typeText = expandType ? expandType.replace(/：$/, '') + '：' : '';
                previewExpand.textContent = ' | ' + typeText + expandResult + ' ' + expandOrderResult;
                previewExpand.style.display = 'inline';
            } else {
                previewExpand.textContent = '';
                previewExpand.style.display = 'none';
            }
        }

        if (previewRemark) {
            if (specialRemark.trim()) {
                previewRemark.textContent = ' | ' + specialRemark;
                previewRemark.style.display = 'inline';
            } else {
                previewRemark.textContent = '';
                previewRemark.style.display = 'none';
            }
        }

        const finalContent = previewContentEl ? previewContentEl.textContent.trim() : '';
        if (previewBox) {
            if (!finalContent || finalContent === '请先填 审核价格') {
                previewBox.classList.add('empty');
            } else {
                previewBox.classList.remove('empty');
            }
        }
    }

    if (auditResultInput2) {
        auditResultInput2.addEventListener('input', updatePreview);
    }
    if (orderResultSelect) {
        orderResultSelect.addEventListener('change', function() {
            updatePreview();
            const auditPriceInput = document.getElementById('re-audit-result');
            if (this.value === '取消') {
                if (auditPriceInput) {
                    auditPriceInput.value = '';
                    auditPriceInput.disabled = true;
                    auditPriceInput.style.background = '#f3f4f6';
                    auditPriceInput.style.cursor = 'not-allowed';
                }
            } else {
                if (auditPriceInput) {
                    auditPriceInput.disabled = false;
                    auditPriceInput.style.background = '';
                    auditPriceInput.style.cursor = '';
                }
            }
        });
    }
    if (rentExpandSwitch) {
        rentExpandSwitch.addEventListener('change', updatePreview);
    }
    if (expandResultInput) {
        expandResultInput.addEventListener('input', updatePreview);
    }
    if (specialRemarkInput) {
        specialRemarkInput.addEventListener('input', updatePreview);
    }
    if (expandTypeSelect) {
        expandTypeSelect.addEventListener('change', updatePreview);
    }
    if (expandOrderResultSelect) {
        expandOrderResultSelect.addEventListener('change', updatePreview);
    }
    updatePreview();

    const riskPreviewText = document.getElementById('re-risk-preview-text');

    const cachedElements = {
        oldDevice: null,
        oldDeviceSelect: null,
        oldDeviceAmount: null,
        workOption: null,
        workContent: null,
        workAmount: null,
        workSalaryType: null,
        otherRemark: null,
        auditResult: null,
        orderResult: null,
        rentExpand: null,
        expandType: null,
        expandResult: null,
        expandOrderResult: null,
        specialRemark: null,
        reduction: null,
        phoneCost: null,
        v4Risk: null,
        flowInputs: null
    };

    function getCachedElement(key, selector) {
        if (!cachedElements[key]) {
            cachedElements[key] = document.querySelector(selector);
        }
        return cachedElements[key];
    }

    function updateRiskPreview() {
        const parts = [];

        const oldDeviceChecked = getCachedElement('oldDevice', '#re-old-device')?.checked || false;
        const oldDeviceSelect = cachedElements.oldDeviceSelect?.value || panel.querySelector('.re-old-device-select')?.value || '';
        const oldDeviceAmount = cachedElements.oldDeviceAmount?.value || panel.querySelector('.re-old-device-select')?.closest('.re-form-inline')?.querySelector('.re-switch-content input')?.value || '';
        if (oldDeviceChecked) {
            if (oldDeviceAmount) parts.push('旧机置换：' + oldDeviceAmount);
        } else {
            if (oldDeviceSelect) parts.push('旧机选项：' + oldDeviceSelect);
        }

        const workOptionChecked = getCachedElement('workOption', '#re-work-option')?.checked || false;
        const workContent = cachedElements.workContent?.value || panel.querySelector('#re-work-option')?.closest('.re-form-inline')?.querySelector('.re-switch-content input')?.value || '';
        const workAmount = cachedElements.workAmount?.value || panel.querySelector('#re-work-option')?.closest('.re-form-inline')?.querySelector('.re-switch-content')?.querySelectorAll('input')[1]?.value || '';
        const workSalaryType = cachedElements.workSalaryType?.value || panel.querySelector('#re-work-option')?.closest('.re-form-inline')?.querySelector('.re-switch-content select')?.value || '';
        const workProofValues = getMultiSelectValues('re-work-proof');
        if (workOptionChecked) {
            let workText = '工作内容：';
            if (workContent) workText += workContent;
            if (workSalaryType && workAmount) workText += '，' + workSalaryType + workAmount;
            if (workProofValues.length > 0) {
                workText += '，' + workProofValues.join('、');
            } else {
                workText += (workText === '工作内容：' ? '' : '，') + '无任何工作材料证明此工作';
            }
            parts.push(workText);
        } else {
            parts.push('无任何工作记录');
        }

        if (!cachedElements.flowInputs) {
            cachedElements.flowInputs = panel.querySelectorAll('.re-flow-section .re-flow-item input');
        }
        const flowLabels = ['微信流水', '支宝流水', '芝麻信用', '花呗情况', '微信分付', '抖音月付', '美团月付', '支付分'];
        cachedElements.flowInputs.forEach((input, index) => {
            if (index < flowLabels.length && input.value.trim()) {
                parts.push(flowLabels[index] + '：' + input.value.trim());
            }
        });

        const shareRent = document.getElementById('re-share-rent')?.value?.trim() || '';
        if (shareRent) parts.push('共租情况：' + shareRent);

        const otherRemark = getCachedElement('otherRemark', '.re-other-remark-input')?.value || '';
        if (otherRemark) parts.push('其他备注：' + otherRemark);

        const auditPrice = getCachedElement('auditResult', '#re-audit-result')?.value || '';
        const auditResult = getCachedElement('orderResult', '#re-order-result')?.value || '';
        if (auditPrice) parts.push((isRestrictAppStoreModel() ? '禁止AppStore：' : '方案一：') + auditPrice + ' ' + auditResult);

        const expandChecked = getCachedElement('rentExpand', '#re-rent-expand')?.checked || false;
        if (expandChecked) {
            const expandType = getCachedElement('expandType', '#re-expand-type')?.value || '';
            const expandPrice = getCachedElement('expandResult', '#re-expand-result')?.value || '';
            const expandResult = getCachedElement('expandOrderResult', '#re-expand-order-result')?.value || '';
            if (expandType && expandPrice) {
                parts.push(expandType.replace(/：$/, '') + '：' + expandPrice + ' ' + expandResult);
            }
        }

        const specialRemark = getCachedElement('specialRemark', '#re-special-remark')?.value || '';
        if (specialRemark) parts.push('客服备注：' + specialRemark);

        let reductionText = '';
        const reductionEl = getCachedElement('reduction', '#re-risk-reduction');
        if (reductionEl) {
            const phoneCostText = getCachedElement('phoneCost', '#re-phone-cost')?.value || '';
            const phoneCost = parseFloat(phoneCostText.replace(/[¥,]/g, '')) || 0;
            const auditPrice = parseFloat(getCachedElement('auditResult', '#re-audit-result')?.value) || 0;
            const v4RiskText = getCachedElement('v4Risk', '#re-v4-risk')?.textContent || '';
            const v4Risk = parseFloat(v4RiskText) || 0;

            if (phoneCost > 0 && auditPrice > 0 && v4Risk > 0) {
                const ratio1 = auditPrice / phoneCost;
                const ratio2 = v4Risk / phoneCost;
                const reductionPercent = ((ratio1 - ratio2) * 100).toFixed(1);

                reductionEl.className = 're-risk-reduction';
                if (parseFloat(reductionPercent) < 0) {
                    reductionText = '降低幅度：降低' + Math.abs(reductionPercent) + '%';
                    reductionEl.classList.add('decrease');
                    reductionEl.textContent = reductionText;
                } else {
                    reductionText = '降低幅度：提高' + reductionPercent + '%';
                    reductionEl.classList.add('increase');
                    reductionEl.textContent = reductionText;
                }
            } else {
                reductionEl.textContent = '';
                reductionEl.className = 're-risk-reduction';
            }
        }

        if (reductionText) parts.push(reductionText);

        const handleMethod = getCachedElement('handleMethod', '#re-handle-method')?.value || '';
        if (handleMethod) parts.push('办理方式：' + handleMethod);

        if (riskPreviewText) {
            if (parts.length > 0) {
                const fullText = parts.join('；');
                riskPreviewText.textContent = fullText;
                riskPreviewText.setAttribute('data-full-text', fullText);
                riskPreviewText.classList.remove('has-more', 'clickable');

                const lineHeight = parseFloat(getComputedStyle(riskPreviewText).lineHeight);
                const maxHeight = lineHeight * 5;

                requestAnimationFrame(() => {
                    if (riskPreviewText.scrollHeight > maxHeight + 2) {
                        riskPreviewText.classList.add('has-more', 'clickable');
                    }
                });
            } else {
                riskPreviewText.textContent = '暂无数据';
                riskPreviewText.removeAttribute('data-full-text');
                riskPreviewText.classList.remove('has-more', 'clickable');
            }
        }

        const riskRemarkBtn = document.getElementById('re-btn-risk-remark');
        if (riskRemarkBtn) {
            if (parts.length === 0) {
                riskRemarkBtn.classList.add('disabled');
                riskRemarkBtn.setAttribute('disabled', 'true');
            } else {
                riskRemarkBtn.classList.remove('disabled');
                riskRemarkBtn.removeAttribute('disabled');
            }
        }
    }

    riskPreviewText?.addEventListener('click', function() {
        if (this.classList.contains('clickable')) {
            const fullText = this.getAttribute('data-full-text');
            if (fullText) {
                showTooltip(fullText, window.innerWidth / 2, window.innerHeight / 2);
            }
        }
    });

    const riskCopyBtn = document.getElementById('re-risk-copy-btn');
    if (riskCopyBtn) {
        riskCopyBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const content = riskPreviewText ? riskPreviewText.getAttribute('data-full-text') || riskPreviewText.textContent.trim() : '';
            if (!content || content === '暂无数据') {
                showTooltip('风控预览内容为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }
            navigator.clipboard.writeText(content).then(() => {
                showSuccessToast('风控预览已复制');
            }).catch(() => {
                showTooltip('复制失败，请手动复制', window.innerWidth / 2, window.innerHeight / 2);
            });
        });
    }

    const allInputs = panel.querySelectorAll('input, select');
    allInputs.forEach(el => {
        if (el.tagName === 'SELECT') {
            el.addEventListener('change', updateRiskPreview);
        } else if (el.type === 'checkbox') {
            el.addEventListener('change', updateRiskPreview);
        } else {
            el.addEventListener('input', updateRiskPreview);
        }
    });
    updateRiskPreview();

    const contactQueryBtn = document.getElementById('re-contact-query');
    const contactEditBtn = document.getElementById('re-contact-edit');
    const phoneDuration = document.getElementById('re-phone-duration');

    if (contactQueryBtn && phoneDuration) {
        contactQueryBtn.addEventListener('click', function() {
            const contactPhoneEl = document.getElementById('re-contact-phone');
            const phone = contactPhoneEl ? contactPhoneEl.textContent.trim() : '';

            if (!phone) {
                showTooltip('手机号为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            contactQueryBtn.disabled = true;
            contactQueryBtn.textContent = '查询中...';

            const queryUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.mobileUseTime + `?mobile=${encodeURIComponent(phone)}`;

            if (typeof GM_xmlhttpRequest === 'undefined') {
                contactQueryBtn.disabled = false;
                contactQueryBtn.textContent = '查询';
                return;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: queryUrl,
                onload: function(response) {
                    contactQueryBtn.disabled = false;
                    contactQueryBtn.textContent = '查询';

                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        const durationEl = doc.evaluate('/html/body/div[2]/div/table/tbody/tr[2]/td', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        const duration = durationEl ? durationEl.textContent.trim() : '';

                        if (duration) {
                            phoneDuration.textContent = duration;
                            contactPhoneEl.classList.remove('re-phone-alert');
                            showSuccessToast('查询成功');
                        } else {
                            contactPhoneEl.classList.add('re-phone-alert');
                            showErrorToast('该手机号未获取到使用时长，请核实真实性');
                        }
                    } catch (e) {
                        showTooltip('解析失败', window.innerWidth / 2, window.innerHeight / 2);
                    }
                },
                onerror: function(error) {
                    contactQueryBtn.disabled = false;
                    contactQueryBtn.textContent = '查询';
                    showTooltip('查询失败', window.innerWidth / 2, window.innerHeight / 2);
                }
            });
        });
    }

    if (contactEditBtn) {
        contactEditBtn.addEventListener('click', function() {
            const orderNoEl = document.getElementById('re-order-no');
            const orderNo = orderNoEl ? orderNoEl.textContent.trim() : '';

            if (!orderNo) {
                showTooltip('订单序号为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            let iframeModal = document.getElementById('re-contact-edit-modal');
            if (!iframeModal) {
                iframeModal = document.createElement('div');
                iframeModal.id = 're-contact-edit-modal';
                iframeModal.className = 're-iframe-modal';
                iframeModal.innerHTML = `
                    <div class="re-iframe-modal-content">
                        <div class="re-iframe-modal-header">
                            <span class="re-iframe-modal-title">编辑联系人</span>
                            <button class="re-iframe-modal-close">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="re-iframe-modal-body">
                            <iframe id="re-contact-edit-iframe" frameborder="0"></iframe>
                        </div>
                    </div>
                `;
                document.body.appendChild(iframeModal);

                iframeModal.querySelector('.re-iframe-modal-close').addEventListener('click', function() {
                    iframeModal.classList.remove('show');
                });

                iframeModal.addEventListener('click', function(e) {
                    if (e.target === iframeModal) {
                        iframeModal.classList.remove('show');
                    }
                });
            }

            const iframe = document.getElementById('re-contact-edit-iframe');
            const editUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.replenishAudit + `?out_order_no=${encodeURIComponent(orderNo)}`;
            iframe.src = editUrl;
            iframeModal.classList.add('show');
        });
    }

    const collapsibleHeader = panel.querySelector('.re-collapsible-header');
    const contactSection = document.getElementById('re-contact-section');
    const riskSection = document.getElementById('re-risk-section');

    if (collapsibleHeader) {
        collapsibleHeader.classList.add('collapsed');
        const infoCard = collapsibleHeader.closest('.re-info-card');
        if (infoCard) {
            infoCard.classList.add('re-card-collapsed');
        }
        collapsibleHeader.addEventListener('click', function(e) {
            if (e.target.closest('.re-edit-icon')) return;
            const isCollapsed = this.classList.toggle('collapsed');
            const infoList = this.nextElementSibling;
            const card = this.closest('.re-info-card');
            if (infoList) {
                infoList.classList.toggle('re-collapsed');
            }
            if (card) {
                card.classList.toggle('re-card-collapsed');
            }
            if (contactSection) {
                if (isCollapsed) {
                    contactSection.classList.remove('re-hidden');
                } else {
                    contactSection.classList.add('re-hidden');
                }
            }
            if (riskSection) {
                if (isCollapsed) {
                    riskSection.classList.remove('re-hidden');
                } else {
                    riskSection.classList.add('re-hidden');
                }
            }
        });
    }

    const staffAssignBtn = document.getElementById('re-btn-staff-assign');
    if (staffAssignBtn) {
        staffAssignBtn.addEventListener('click', function() {
            const orderNoEl = document.getElementById('re-order-no');
            const orderNo = orderNoEl ? orderNoEl.textContent.trim() : '';

            if (!orderNo) {
                showTooltip('订单序号为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            getStaffName().then(staffName => {
                if (!staffName) {
                    showStaffInputModal();
                    return;
                }

                doStaffAssignViaIframe(orderNo, staffName, function(success, message) {
                    if (success) {
                        showSuccessToast('客服分配：' + staffName + ' 已完成！');
                    } else {
                        showTooltip(message || '客服分配失败', window.innerWidth / 2, window.innerHeight / 2);
                    }
                });
            }).catch(err => {
                showStaffInputModal();
            });
        });
    }

    function doStaffAssignViaIframe(orderNo, staffName, callback) {
        let iframe = document.getElementById('re-assign-iframe');
        if (iframe) {
            iframe.remove();
        }

        iframe = document.createElement('iframe');
        iframe.id = 're-assign-iframe';
        iframe.style.cssText = 'position: fixed; left: -9999px; top: -9999px; width: 800px; height: 600px; opacity: 0; pointer-events: none;';
        document.body.appendChild(iframe);

        const assignUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.paylogAllot + '?out_order_no=' + orderNo + '&is_sjmm=1';

        let loadTimeout = null;
        let completed = false;

        function cleanup() {
            if (loadTimeout) clearTimeout(loadTimeout);
            if (iframe) {
                setTimeout(() => {
                    if (iframe && iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                }, 1000);
            }
        }

        function handleResult(success, message) {
            if (completed) return;
            completed = true;
            cleanup();
            callback(success, message);
        }

        loadTimeout = setTimeout(() => {
            handleResult(false, 'iframe加载超时');
        }, 30000);

        iframe.onload = function() {
            if (completed) return;

            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                const videoSelect = iframeDoc.getElementById('video_review_staff_id');

                if (!videoSelect) {
                    handleResult(false, '未找到视频面审客服下拉框');
                    return;
                }

                let foundValue = null;
                const options = videoSelect.querySelectorAll('option');
                for (let i = 0; i < options.length; i++) {
                    const optionText = options[i].textContent.trim();
                    if (optionText === staffName || optionText.includes(staffName)) {
                        foundValue = options[i].value;
                        break;
                    }
                }

                if (!foundValue) {
                    handleResult(false, '未找到客服: ' + staffName);
                    return;
                }

                videoSelect.value = foundValue;

                const form = iframeDoc.getElementById('form-signup');
                if (!form) {
                    handleResult(false, '未找到表单');
                    return;
                }

                const submitBtn = form.querySelector('button[type="submit"], .btna');
                if (submitBtn) {
                    submitBtn.click();
                } else {
                    form.submit();
                }

                setTimeout(() => {
                    handleResult(true, '客服分配成功');
                }, 500);

            } catch (e) {
                handleResult(false, '操作异常: ' + e.message);
            }
        };

        iframe.onerror = function() {
            handleResult(false, 'iframe加载失败');
        };

        iframe.src = assignUrl;
    }

    function showSuccessToast(message) {
        let toast = document.getElementById('re-success-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 're-success-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #10b981;
                color: #fff;
                padding: 14px 28px;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 500;
                z-index: 2147483649;
                box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
                opacity: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>${message}</span>
        `;

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, CONFIG.TIME.clickDelay);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
        }, CONFIG.TIME.toastDuration);
    }

    function showErrorToast(message) {
        let toast = document.getElementById('re-error-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 're-error-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #dc2626;
                color: #fff;
                padding: 14px 28px;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 500;
                z-index: 2147483649;
                box-shadow: 0 8px 32px rgba(220, 38, 38, 0.4);
                opacity: 0;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: opacity 0.3s ease, transform 0.3s ease;
            `;
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>${message}</span>
        `;

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, CONFIG.TIME.clickDelay);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
        }, CONFIG.TIME.toastDuration);
    }

    // 风险面板相关函数
    function collectRiskItems() {
        const riskItems = [];

        // 1. 共租维度
        const newRentEl = document.getElementById('re-new-rent');
        if (newRentEl) {
            const value = newRentEl.textContent.trim();
            if (value && value !== '无共租风险') {
                riskItems.push({
                    type: 'high',
                    title: '共租维度',
                    badge: value,
                    detail: '存在共租风险'
                });
            }
        }

        // 2. 风控等级
        const riskLevelEl = document.getElementById('re-risk-level');
        if (riskLevelEl) {
            const value = riskLevelEl.textContent.trim();
            if (value && value.includes('高')) {
                riskItems.push({
                    type: 'high',
                    title: '风控等级',
                    badge: value,
                    detail: '高风险客户'
                });
            }
        }

        // 3. V4风控
        const v4RiskEl = document.getElementById('re-v4-risk');
        if (v4RiskEl) {
            const value = v4RiskEl.textContent.trim();
            if (value && value.includes('高')) {
                riskItems.push({
                    type: 'high',
                    title: 'V4风控',
                    badge: value,
                    detail: 'V4风控高风险'
                });
            }
            // V4风控百分比超过50%
            const v4Percent = parseFloat(value);
            if (!isNaN(v4Percent) && v4Percent > 50) {
                riskItems.push({
                    type: 'high',
                    title: 'V4风控偏高',
                    badge: v4Percent + '元',
                    detail: `初审<span>${v4Percent}元</span>，<span>阈值偏高</span>`
                });
            }
        }

        // 4. 司法风险
        const legalStatusEl = document.getElementById('re-legal-status');
        if (legalStatusEl) {
            const value = legalStatusEl.textContent.trim();
            if (value && value !== '没有司法风险人员') {
                riskItems.push({
                    type: 'high',
                    title: '司法风险人员',
                    badge: value,
                    detail: '存在司法风险'
                });
            }
        }

        // 5. 店铺逾期率
        const shopOverdueEl = document.getElementById('re-shop-overdue');
        if (shopOverdueEl) {
            const text = shopOverdueEl.textContent.trim();
            const value = parseFloat(text);
            if (!isNaN(value) && value > 6) {
                riskItems.push({
                    type: 'high',
                    title: '店铺逾期率',
                    badge: value + '%',
                    detail: `逾期率<span>${value}%</span>，<span>阈值高</span>`
                });
            } else if (!isNaN(value) && value > 3) {
                riskItems.push({
                    type: 'medium',
                    title: '店铺逾期率',
                    badge: value + '%',
                    detail: `逾期率<span>${value}%</span>，<span>阈值偏高</span>`
                });
            }
        }

        // 6. 店铺离线比例
        const shopOfflineEl = document.getElementById('re-shop-offline');
        if (shopOfflineEl) {
            const text = shopOfflineEl.textContent.trim();
            const value = parseFloat(text);
            if (!isNaN(value) && value > 7) {
                riskItems.push({
                    type: 'high',
                    title: '店铺离线比例',
                    badge: value + '%',
                    detail: `离线比例<span>${value}%</span>，<span>红色阈值</span>`
                });
            } else if (!isNaN(value) && value > 4) {
                riskItems.push({
                    type: 'medium',
                    title: '店铺离线比例',
                    badge: value + '%',
                    detail: `离线比例<span>${value}%</span>，<span>黄色阈值</span>`
                });
            }
        }

        // 7. 店铺类型
        const shopCategoryEl = document.getElementById('re-shop-category');
        if (shopCategoryEl) {
            const value = shopCategoryEl.textContent.trim();
            if (value === '出资商家') {
                riskItems.push({
                    type: 'high',
                    title: '店铺类型',
                    badge: value,
                    detail: '出资商家类型'
                });
            }
        }

        // 8. 超指导价
        const phoneCostDiffContainer = document.getElementById('re-phone-cost-diff');
        if (phoneCostDiffContainer) {
            const priceDiffEl = phoneCostDiffContainer.querySelector('.re-price-diff');
            if (priceDiffEl) {
                const value = priceDiffEl.textContent.trim();
                if (value && value.startsWith('超')) {
                    riskItems.push({
                        type: 'high',
                        title: '超指导价',
                        badge: value,
                        detail: `手机成本<span>${value}</span>`
                    });
                }
            }
        }

        // 9. 超龄客户
        const headerDataEl = document.querySelector('.re-header-data');
        if (headerDataEl) {
            const text = headerDataEl.textContent.trim();
            const ageMatch = text.match(/(\d+)岁/);
            if (ageMatch) {
                const value = parseInt(ageMatch[1]);
                if (!isNaN(value) && value > CONFIG.THRESHOLD.overageAge) {
                    riskItems.push({
                        type: 'medium',
                        title: '超龄客户',
                        badge: value + '岁',
                        detail: `年龄<span>${value}岁</span>，高阈值<span>${CONFIG.THRESHOLD.overageAge}岁</span>`
                    });
                }
            }
        }

        // 10. 高风险机型
        const productInfoEl = document.getElementById('re-product-info');
        if (productInfoEl) {
            const fullText = productInfoEl.textContent.trim();
            // 提取纯机型名，去掉内存等后缀，如 "iPhone 17 Pro Max 256GB" → "iPhone 17 Pro Max"
            const modelMatch = fullText.match(/^(iPhone\s+\d+\s+Pro\s+Max|iPhone\s+\d+\s+Pro)/i);
            if (modelMatch) {
                const modelName = modelMatch[0];
                riskItems.push({
                    type: 'high',
                    title: '高风险机型',
                    badge: modelName,
                    detail: `机型<span>${modelName}</span>，属于高风险机型`
                });
            }
        }

        return riskItems;
    }

    function updateRiskPanel() {
        const riskPanel = document.getElementById('re-risk-panel');
        const riskContent = document.getElementById('re-risk-panel-content');
        const riskCount = document.getElementById('re-risk-count');

        if (!riskPanel || !riskContent) return;

        const items = collectRiskItems();
        const count = items.length;

        // 更新数量
        if (riskCount) {
            riskCount.textContent = '(' + count + ')';
        }

        // 清空内容
        riskContent.innerHTML = '';

        // 如果无内容，显示空状态
        if (items.length === 0) {
            riskContent.innerHTML = `
                <div class="re-risk-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                    <span>所有检测项正常</span>
                </div>
            `;
            return;
        }

        // 渲染项目
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 're-risk-item re-risk-' + item.type;
            itemEl.innerHTML = `
                <div class="re-risk-item-header">
                    <div class="re-risk-item-dot"></div>
                    <span class="re-risk-item-title">${item.title}</span>
                    <span class="re-risk-item-badge">${item.badge}</span>
                </div>
                <div class="re-risk-item-detail">${item.detail}</div>
            `;
            riskContent.appendChild(itemEl);
        });
    }

    function toggleRiskPanel(show) {
        const riskPanel = document.getElementById('re-risk-panel');
        if (!riskPanel) return;

        if (show) {
            riskPanel.classList.add('re-risk-visible');
            updateRiskPanel();
        } else {
            riskPanel.classList.remove('re-risk-visible');
        }
    }

    // 风险面板开关事件
    const riskPanelSwitch = document.getElementById('re-setting-risk-panel');
    if (riskPanelSwitch) {
        // 初始化开关状态
        const savedState = GM_getValue(CONFIG.STORAGE.riskPanelEnabledKey, true);
        riskPanelSwitch.checked = savedState;
        if (savedState) {
            toggleRiskPanel(true);
        }

        riskPanelSwitch.addEventListener('change', function() {
            const enabled = this.checked;
            GM_setValue(CONFIG.STORAGE.riskPanelEnabledKey, enabled);
            toggleRiskPanel(enabled);
        });
    }

    // 风险面板关闭按钮
    const riskPanelCloseBtn = document.getElementById('re-risk-panel-close');
    if (riskPanelCloseBtn) {
        riskPanelCloseBtn.addEventListener('click', function() {
            toggleRiskPanel(false);
            const riskPanelSwitch = document.getElementById('re-setting-risk-panel');
            if (riskPanelSwitch) {
                riskPanelSwitch.checked = false;
                GM_setValue(CONFIG.STORAGE.riskPanelEnabledKey, false);
            }
        });
    }

    const staffRemarkBtn = document.getElementById('re-btn-staff-remark');
    if (staffRemarkBtn) {
        staffRemarkBtn.addEventListener('click', function() {
            if (this.classList.contains('disabled') || this.hasAttribute('disabled')) {
                return;
            }

            const orderNoEl = document.getElementById('re-order-no');
            const orderNo = orderNoEl ? orderNoEl.textContent.trim() : '';

            if (!orderNo) {
                showTooltip('订单序号为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            const previewContentEl = document.getElementById('re-preview-content');
            const previewContent = previewContentEl ? previewContentEl.textContent.trim() : '';

            if (!previewContent) {
                showTooltip('即时预览内容为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            const remarkUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.staffRemark + '?out_order_no=' + orderNo;

            if (typeof GM_xmlhttpRequest === 'undefined') {
                showTooltip('GM_xmlhttpRequest不可用', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: remarkUrl,
                onload: function(response) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');

                    const contentTextarea = doc.getElementById('content');
                    const outOrderNoInput = doc.querySelector('input[name="out_order_no"]');

                    if (contentTextarea) {
                        const postData = 'classify=0&content=' + encodeURIComponent(previewContent) + '&out_order_no=' + encodeURIComponent(orderNo);

                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.staffRemark,
                            data: postData,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            onload: function(postResponse) {
                                try {
                                    const result = JSON.parse(postResponse.responseText);
                                    if (result.status) {
                                        showSuccessToast('客服备注 已添加！');
                                    } else {
                                        showTooltip(result.msg || '提交失败', window.innerWidth / 2, window.innerHeight / 2);
                                    }
                                } catch (e) {
                                    showSuccessToast('客服备注 已添加！');
                                }
                            },
                            onerror: function(postError) {
                                showTooltip('备注提交失败', window.innerWidth / 2, window.innerHeight / 2);
                            }
                        });
                    } else {
                        showTooltip('页面解析失败', window.innerWidth / 2, window.innerHeight / 2);
                    }
                },
                onerror: function(error) {
                    showTooltip('访问备注页面失败', window.innerWidth / 2, window.innerHeight / 2);
                }
            });
        });
    }

    const riskRemarkBtn = document.getElementById('re-btn-risk-remark');
    if (riskRemarkBtn) {
        riskRemarkBtn.addEventListener('click', function() {
            if (this.classList.contains('disabled') || this.hasAttribute('disabled')) {
                return;
            }

            const orderNoEl = document.getElementById('re-order-no');
            const orderNo = orderNoEl ? orderNoEl.textContent.trim() : '';

            if (!orderNo) {
                showTooltip('订单序号为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            const riskPreviewEl = document.getElementById('re-risk-preview-text');
            const riskPreviewContent = riskPreviewEl ? riskPreviewEl.textContent.trim() : '';

            if (!riskPreviewContent || riskPreviewContent === '暂无数据') {
                showTooltip('风控预览内容为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            const remarkUrl = CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.riskQuestion + '?out_order_no=' + orderNo;

            if (typeof GM_xmlhttpRequest === 'undefined') {
                showTooltip('GM_xmlhttpRequest不可用', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: remarkUrl,
                onload: function(response) {
                    // 独立填充面审风控表单对应字段
                    const wechatBill = (document.getElementById('re-wechat-flow')?.value || '').trim();
                    const alipayBill = (document.getElementById('re-alipay-flow')?.value || '').trim();
                    const alipayCreditScore = (document.getElementById('re-zhima-credit')?.value || '').trim();
                    const huabeiLimit = (document.getElementById('re-huabei-status')?.value || '').trim();
                    const fenfuLimit = (document.getElementById('re-wechat-fenfu')?.value || '').trim();
                    const douyinPay = (document.getElementById('re-douyin-pay')?.value || '').trim();
                    const meituanPay = (document.getElementById('re-meituan-pay')?.value || '').trim();
                    const wechatCreditScore = (document.getElementById('re-wechat-credit-score')?.value || '').trim();
                    const shareRent = (document.getElementById('re-share-rent')?.value || '').trim();

                    let salary = '';
                    const workOptionChecked = document.getElementById('re-work-option')?.checked || false;
                    if (!workOptionChecked) {
                        salary = '无任何工作情况证明';
                    } else {
                        const workContent = (document.getElementById('re-work-content')?.value || '').trim();
                        const workAmount = (document.getElementById('re-work-amount')?.value || '').trim();
                        const salaryType = (document.getElementById('re-salary-type')?.value || '').trim();
                        const workProofValues = getMultiSelectValues('re-work-proof');
                        salary = workContent;
                        if (workAmount && salaryType) salary += (salary ? '，' : '') + salaryType + workAmount;
                        else if (workAmount) salary += (salary ? '，' : '') + workAmount;
                        if (workProofValues.length > 0) {
                            salary += (salary ? '，' : '') + workProofValues.join('、');
                        } else {
                            salary += (salary ? '，' : '') + '无任何工作材料证明此工作';
                        }
                    }

                    // 旧机处理
                    let oldDevice = '';
                    const oldDeviceChecked = document.getElementById('re-old-device')?.checked;
                    if (oldDeviceChecked) {
                        const oldDeviceAmount = (document.getElementById('re-old-device-amount')?.value || '').trim();
                        oldDevice = oldDeviceAmount ? '旧机置换：' + oldDeviceAmount : '旧机保留';
                    } else {
                        const oldDeviceType = (document.getElementById('re-old-device-type')?.value || '').trim();
                        oldDevice = oldDeviceType || '旧机不保留';
                    }

                    // 收集备注信息（包含审核结果、降低幅度、办理方式）
                    let remarkParts = [];
                    const otherRemark = (document.getElementById('re-other-remark')?.value || '').trim();
                    if (otherRemark) {
                        remarkParts.push(otherRemark);
                    }

                    // 添加审核结果
                    const auditPrice = (document.getElementById('re-audit-result')?.value || '').trim();
                    const auditResult = (document.getElementById('re-order-result')?.value || '').trim();
                    if (auditPrice && auditResult) {
                        remarkParts.push((isRestrictAppStoreModel() ? '禁止AppStore：' : '方案一：') + auditPrice + ' ' + auditResult);
                    }

                    // 添加拓展业务
                    const expandChecked = document.getElementById('re-rent-expand')?.checked || false;
                    if (expandChecked) {
                        const expandType = (document.getElementById('re-expand-type')?.value || '').trim();
                        const expandPrice = (document.getElementById('re-expand-result')?.value || '').trim();
                        const expandResult = (document.getElementById('re-expand-order-result')?.value || '').trim();
                        if (expandType && expandPrice) {
                            remarkParts.push(expandType.replace(/：$/, '') + '：' + expandPrice + ' ' + expandResult);
                        }
                    }

                    // 添加降低幅度
                    const phoneCostText = (document.getElementById('re-phone-cost')?.value || '').trim();
                    const phoneCost = parseFloat(phoneCostText.replace(/[¥,]/g, '')) || 0;
                    const auditPriceNum = parseFloat(auditPrice) || 0;
                    const v4RiskText = (document.getElementById('re-v4-risk')?.textContent || '').trim();
                    const v4Risk = parseFloat(v4RiskText) || 0;

                    if (phoneCost > 0 && auditPriceNum > 0 && v4Risk > 0) {
                        const ratio1 = auditPriceNum / phoneCost;
                        const ratio2 = v4Risk / phoneCost;
                        const reductionPercent = ((ratio1 - ratio2) * 100).toFixed(1);

                        if (parseFloat(reductionPercent) < 0) {
                            remarkParts.push('降低幅度：降低' + Math.abs(reductionPercent) + '%');
                        } else {
                            remarkParts.push('降低幅度：提高' + reductionPercent + '%');
                        }
                    }

                    // 添加办理方式
                    const handleMethod = (document.getElementById('re-handle-method')?.value || '').trim();
                    if (handleMethod) {
                        remarkParts.push('办理方式：' + handleMethod);
                    }

                    // 用分号连接所有备注部分
                    const finalRemark = remarkParts.join('；');

                    const params = {
                        operator: '1',
                        budget: '',
                        old_device: oldDevice,
                        alipay_credit_score: alipayCreditScore,
                        wechat_credit_score: wechatCreditScore,
                        huabei_limit: huabeiLimit,
                        alipay_bill: alipayBill,
                        meituan_pay: meituanPay,
                        fenfu_limit: fenfuLimit,
                        wechat_bill: wechatBill,
                        douyin_pay: douyinPay,
                        salary: salary,
                        share_rent: shareRent,
                        remark: finalRemark,
                        out_order_no: orderNo
                    };
                    const postData = Object.entries(params).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');

                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.riskRemark,
                        data: postData,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        onload: function(postResponse) {
                            try {
                                const result = JSON.parse(postResponse.responseText);
                                if (result.status || result.code === 0) {
                                    showSuccessToast('风控备注 已添加！');
                                } else {
                                    showTooltip(result.msg || result.message || '提交失败', window.innerWidth / 2, window.innerHeight / 2);
                                }
                            } catch (e) {
                                showSuccessToast('风控备注 已添加！');
                            }
                        },
                        onerror: function(postError) {
                            showTooltip('备注提交失败', window.innerWidth / 2, window.innerHeight / 2);
                        }
                    });
                },
                onerror: function(error) {
                    showTooltip('访问备注页面失败', window.innerWidth / 2, window.innerHeight / 2);
                }
            });
        });
    }

    // 无锁操作按钮功能
    const noLockBtn = document.getElementById('re-btn-no-lock');
    const noLockPanel = document.getElementById('re-no-lock-panel');
    const noLockClose = document.getElementById('re-no-lock-close');
    const noLockHeader = noLockPanel?.querySelector('.re-no-lock-header');

    // 无锁面板拖动功能
    let isNoLockDragging = false;
    let noLockCurrentX, noLockCurrentY, noLockInitialX, noLockInitialY;

    if (noLockHeader && noLockPanel) {
        noLockHeader.addEventListener('mousedown', function(e) {
            if (e.target.closest('.re-no-lock-close') || e.target.closest('.re-no-lock-status')) {
                return;
            }
            isNoLockDragging = true;
            noLockInitialX = e.clientX - (parseInt(noLockPanel.style.left) || 0);
            noLockInitialY = e.clientY - (parseInt(noLockPanel.style.top) || 0);
            noLockPanel.style.transition = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (isNoLockDragging) {
                e.preventDefault();
                noLockCurrentX = e.clientX - noLockInitialX;
                noLockCurrentY = e.clientY - noLockInitialY;
                noLockPanel.style.left = noLockCurrentX + 'px';
                noLockPanel.style.top = noLockCurrentY + 'px';
                noLockPanel.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', function() {
            if (isNoLockDragging) {
                isNoLockDragging = false;
                noLockPanel.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // 保存拖动后的位置
                const currentLeft = noLockPanel.style.left;
                const currentTop = noLockPanel.style.top;
                GM_setValue('noLockPanelPosition', {
                    left: currentLeft,
                    top: currentTop
                });
            }
        });
    }

    // 数据解析函数
    function parseCredit(val) {
        if (!val || val.trim() === '') return 0;
        const num = parseFloat(val.replace(/[^\d.]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    function parseAmount(val) {
        if (!val) return 0;
        const num = parseFloat(val.replace(/[^\d.]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    // 格式化展示：整数显示整数，小数最多2位
    function formatDisplay(num) {
        if (!num || num === 0) return num === 0 ? '0' : '';
        const rounded = Math.round(num * 100) / 100;
        return String(rounded);
    }

    // 计算和更新无锁判断
    function calculateNoLock() {
        const flowInputs = panel.querySelectorAll('.re-flow-section .re-flow-item input');
        
        // 读取四项信用工具额度
        const huabei = parseCredit(flowInputs[3]?.value);
        const fenfu = parseCredit(flowInputs[4]?.value);
        const douyin = parseCredit(flowInputs[5]?.value);
        const meituan = parseCredit(flowInputs[6]?.value);

        // 读取V4风控结果
        const v4RiskEl = document.getElementById('re-v4-risk');
        const v4Risk = parseFloat(v4RiskEl?.textContent) || 0;

        // 读取手机成本
        const costInput = document.getElementById('re-nl-cost-input');
        let phoneCost = parseAmount(costInput?.value);

        // 如果成本为0，从面板读取
        if (phoneCost === 0) {
            const phoneCostEl = document.getElementById('re-phone-cost');
            phoneCost = parseAmount(phoneCostEl?.value);
            if (costInput) {
                costInput.value = phoneCost > 0 ? phoneCost : '';
            }
        }

        // 更新显示值
        document.getElementById('re-nl-fenfu').textContent = fenfu > 0 ? formatDisplay(fenfu) : '未开通';
        document.getElementById('re-nl-huabei').textContent = huabei > 0 ? formatDisplay(huabei) : '未开通';
        document.getElementById('re-nl-douyin').textContent = douyin > 0 ? formatDisplay(douyin) : '未开通';
        document.getElementById('re-nl-meituan').textContent = meituan > 0 ? formatDisplay(meituan) : '未开通';

        // 总计额度只计入分付和花呗，抖音和美团仅展示
        const totalCredit = huabei + fenfu;
        document.getElementById('re-nl-total').textContent = formatDisplay(totalCredit);
        document.getElementById('re-nl-v4').textContent = formatDisplay(v4Risk);

        // 计算结果
        const statusEl = document.getElementById('re-nl-status');
        
        if (phoneCost === 0) {
            document.getElementById('re-nl-ratio').textContent = '—';
            document.getElementById('re-nl-min').textContent = '成本未知';
            statusEl.textContent = '请输入成本';
            statusEl.className = 're-no-lock-status pending';
            return;
        }

        const creditRatio = (totalCredit / phoneCost * 100).toFixed(2);
        const noLockMin = ((0.9 - totalCredit / phoneCost) * phoneCost).toFixed(2);
        const satisfied = (totalCredit + v4Risk) / phoneCost >= 0.9;

        document.getElementById('re-nl-ratio').textContent = creditRatio + '%';
        document.getElementById('re-nl-min').textContent = noLockMin;

        if (satisfied) {
            statusEl.textContent = '✓ 满足无锁';
            statusEl.className = 're-no-lock-status satisfied';
        } else {
            statusEl.textContent = '✗ 不满足无锁';
            statusEl.className = 're-no-lock-status unsatisfied';
        }

        // 更新预览框
        updatePreviews(satisfied, fenfu, huabei, douyin, meituan, v4Risk, phoneCost, totalCredit);
    }

    // 更新预览框内容
    function updatePreviews(satisfied, fenfu, huabei, douyin, meituan, v4Risk, phoneCost, totalCredit) {
        // 获取客户姓名
        const customerName = cachedName || document.getElementById('re-contact-name')?.textContent || '【无参数】';
        
        // 获取客服姓名
        const staffNameEl = document.getElementById('re-staff-name');
        const staffName = staffNameEl?.textContent || '未知客服';
        
        // 获取订单号
        const orderNoEl = document.getElementById('re-order-no');
        const orderNo = orderNoEl?.textContent || '【无参数】';
        
        // 获取机型
        const productInfoEl = document.getElementById('re-product-info');
        const productInfo = productInfoEl?.textContent || 'iPhone 15 Pro Max 256GB';
        
        // 获取套餐信息
        const packageInfoEl = document.getElementById('re-package-info');
        const packageInfo = packageInfoEl?.textContent || '12期免息套餐';

        // 备注预览框1 - 仅显示已开通项，未开通不显示
        const creditParts = [];
        if (fenfu > 0) creditParts.push(`分付额度：${formatDisplay(fenfu)}`);
        if (huabei > 0) creditParts.push(`花呗额度：${formatDisplay(huabei)}`);
        if (douyin > 0) creditParts.push(`抖音月付：${formatDisplay(douyin)}`);
        if (meituan > 0) creditParts.push(`美团月付：${formatDisplay(meituan)}`);
        const creditSegment = creditParts.length > 0 ? creditParts.join('、') + ' ' : '没有相关额度 ';

        const lockStatus = satisfied ? '无锁通过' : '正常办理上锁通过';
        const remarkPreview = `${customerName} ${creditSegment}手机妈妈 ${formatDisplay(v4Risk)} [${lockStatus}]`;
        document.getElementById('re-nl-preview-remark').value = remarkPreview;

        // 登记Excel预览框2 - 0显示为"未开通"
        const fenfuDisplay = fenfu > 0 ? formatDisplay(fenfu) : '未开通';
        const huabeiDisplay = huabei > 0 ? formatDisplay(huabei) : '未开通';
        const douyinDisplay = douyin > 0 ? formatDisplay(douyin) : '未开通';
        const meituanDisplay = meituan > 0 ? formatDisplay(meituan) : '未开通';

        // 合计：如果全部为0则显示0，否则显示实际相加值
        const totalDisplay = totalCredit > 0 ? formatDisplay(totalCredit) : '0';

        const excelPreview = `${staffName}\t${customerName}\t${orderNo}\t${productInfo}\t${packageInfo}\t${formatDisplay(phoneCost)}\t${fenfuDisplay}\t${huabeiDisplay}\t${douyinDisplay}\t${meituanDisplay}\t${totalDisplay}`;
        document.getElementById('re-nl-preview-excel').value = excelPreview;
    }

    // 打开弹窗
    if (noLockBtn) {
        noLockBtn.addEventListener('click', function() {
            if (noLockPanel) {
                // 恢复上次保存的位置
                const savedPos = GM_getValue('noLockPanelPosition');
                if (savedPos) {
                    noLockPanel.style.left = savedPos.left;
                    noLockPanel.style.top = savedPos.top;
                    noLockPanel.style.right = 'auto';
                }
                calculateNoLock();
                noLockPanel.classList.add('re-no-lock-visible');
            }
        });
    }

    // 关闭弹窗
    if (noLockClose) {
        noLockClose.addEventListener('click', function() {
            if (noLockPanel) {
                // 保存当前位置
                const currentLeft = noLockPanel.style.left || 'auto';
                const currentTop = noLockPanel.style.top || '80px';
                if (currentLeft !== 'auto') {
                    GM_setValue('noLockPanelPosition', {
                        left: currentLeft,
                        top: currentTop
                    });
                }
                noLockPanel.classList.remove('re-no-lock-visible');
            }
        });
    }

    // 重新计算按钮
    const recalcBtn = document.getElementById('re-nl-recalc');
    if (recalcBtn) {
        recalcBtn.addEventListener('click', function() {
            calculateNoLock();
        });
    }

    // 复制按钮功能
    const copyRemarkBtn = document.getElementById('re-nl-copy-remark');
    const copyExcelBtn = document.getElementById('re-nl-copy-excel');
    const submitRemarkBtn = document.getElementById('re-nl-submit-remark');

    if (copyRemarkBtn) {
        copyRemarkBtn.addEventListener('click', function() {
            const textArea = document.getElementById('re-nl-preview-remark');
            if (textArea) {
                textArea.select();
                document.execCommand('copy');
                showSuccessToast('备注预览已复制');
            }
        });
    }

    if (copyExcelBtn) {
        copyExcelBtn.addEventListener('click', function() {
            const textArea = document.getElementById('re-nl-preview-excel');
            if (textArea) {
                textArea.select();
                document.execCommand('copy');
                showSuccessToast('Excel预览已复制');
            }
        });
    }

    // 提交客服备注按钮
    if (submitRemarkBtn) {
        submitRemarkBtn.addEventListener('click', function() {
            const remarkContent = document.getElementById('re-nl-preview-remark')?.value;
            const orderNoEl = document.getElementById('re-order-no');
            const outOrderNo = orderNoEl?.textContent?.trim();

            if (!remarkContent || remarkContent.trim() === '') {
                showErrorToast('备注内容为空');
                return;
            }

            if (!outOrderNo) {
                showErrorToast('订单号获取失败');
                return;
            }

            // 禁用按钮防止重复点击
            submitRemarkBtn.disabled = true;
            submitRemarkBtn.style.opacity = '0.6';

            // 提交备注
            GM_xmlhttpRequest({
                method: 'POST',
                url: CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.staffRemark,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `classify=0&content=${encodeURIComponent(remarkContent)}&out_order_no=${outOrderNo}`,
                onload: function(response) {
                    submitRemarkBtn.disabled = false;
                    submitRemarkBtn.style.opacity = '1';
                    
                    try {
                        const result = JSON.parse(response.responseText);
                        if (result.status) {
                            showSuccessToast('客服备注提交成功');
                        } else {
                            showErrorToast(result.msg || '备注提交失败');
                        }
                    } catch (e) {
                        showErrorToast('响应解析失败');
                    }
                },
                onerror: function() {
                    submitRemarkBtn.disabled = false;
                    submitRemarkBtn.style.opacity = '1';
                    showErrorToast('网络请求失败');
                }
            });
        });
    }

    const autoProcessBtn = document.getElementById('re-btn-auto-process');
    if (autoProcessBtn) {
        autoProcessBtn.addEventListener('click', function() {
            const orderNoEl = document.getElementById('re-order-no');
            const orderNo = orderNoEl ? orderNoEl.textContent.trim() : '';

            if (!orderNo) {
                showTooltip('订单序号为空', window.innerWidth / 2, window.innerHeight / 2);
                return;
            }

            const auditPriceInput = document.getElementById('re-audit-result');
            const auditPrice = auditPriceInput ? auditPriceInput.value.trim() : '';
            const orderResultSelect = document.getElementById('re-order-result');
            const orderResult = orderResultSelect ? orderResultSelect.value : '';

            if (orderResult !== '取消' && !auditPrice) {
                showTooltip('请填写审核价格', window.innerWidth / 2, window.innerHeight / 2);
                if (auditPriceInput) auditPriceInput.focus();
                return;
            }

            const originalContent = this.innerHTML;
            this.classList.add('processing');
            this.disabled = true;

            getStaffName().then(staffName => {
                if (!staffName) {
                    autoProcessBtn.classList.remove('processing');
                    autoProcessBtn.disabled = false;
                    showStaffInputModal();
                    return;
                }

                const previewContentEl = document.getElementById('re-preview-content');
                const previewContent = previewContentEl ? previewContentEl.textContent.trim() : '';

                const riskPreviewEl = document.getElementById('re-risk-preview-text');
                const riskPreviewContent = riskPreviewEl ? riskPreviewEl.textContent.trim() : '';

                const headerDataEl = panel.querySelector('.re-header-data');
                const headerData = headerDataEl ? headerDataEl.textContent.trim() : '';

                const productInfoEl = document.getElementById('re-product-info');
                const model = productInfoEl ? productInfoEl.textContent.trim() : '';

                let name = cachedName || '';
                let shop = cachedShop || '';
                if (!shop && headerData) {
                    const shopMatch = headerData.match(/【([^】]+)】\s*$/);
                    if (shopMatch) {
                        shop = shopMatch[1];
                    }
                }

                let completed = 0;
                const total = 3;
                const results = { assign: false, staffRemark: false, riskRemark: false };

                function checkAllCompleted() {
                    completed++;

                    if (completed === total) {
                        setTimeout(() => {
                            const successCount = (results.assign ? 1 : 0) + (results.staffRemark ? 1 : 0) + (results.riskRemark ? 1 : 0);

                            autoProcessBtn.classList.remove('processing');

                            if (successCount === total) {
                                autoProcessBtn.classList.add('completed');
                                autoProcessBtn.innerHTML = '<svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>已完成';

                                navigator.clipboard.writeText(previewContent).then(() => {
                                    showSuccessToast('自动处理完成！即时预览已复制');
                                }).catch(() => {
                                    showSuccessToast('自动处理完成！全部成功');
                                });

                                const now = new Date();
                                const record = {
                                    name: name,
                                    model: model,
                                    shop: shop,
                                    preview: riskPreviewContent,
                                    date: now.toISOString().split('T')[0],
                                    time: now.toTimeString().split(' ')[0]
                                };

                                saveHistoryRecord(record).then(() => {
                                    renderHistoryRecords();
                                }).catch(err => {
                                });

                                setTimeout(() => {
                                    autoProcessBtn.classList.remove('completed');
                                    autoProcessBtn.innerHTML = originalContent;
                                    autoProcessBtn.disabled = false;

                                    if (autoRefreshEnabled) {
                                        showSuccessToast('页面即将刷新...');
                                        setTimeout(() => {
                                            location.reload();
                                        }, 800);
                                    }
                                }, 2000);

                            } else {
                                autoProcessBtn.disabled = false;
                                showSuccessToast(`自动处理完成！成功 ${successCount}/${total} 项`);
                            }
                        }, 300);
                    }
                }

                doStaffAssign(orderNo, staffName, function(success) {
                    results.assign = success;
                    checkAllCompleted();
                });

                doStaffRemark(orderNo, previewContent, function(success) {
                    results.staffRemark = success;
                    checkAllCompleted();
                });

                doRiskRemark(orderNo, collectRiskRemarkData(), function(success) {
                    results.riskRemark = success;
                    checkAllCompleted();
                });

            }).catch(err => {
                autoProcessBtn.classList.remove('processing');
                autoProcessBtn.disabled = false;
                showStaffInputModal();
            });
        });
    }

    function doStaffAssign(orderNo, staffName, callback) {
        doStaffAssignViaIframe(orderNo, staffName, function(success, message) {
            callback(success);
        });
    }

    function doStaffRemark(orderNo, content, callback) {
        if (!content) { callback(false); return; }

        GM_xmlhttpRequest({
            method: 'POST',
            url: CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.staffRemark,
            data: 'classify=0&content=' + encodeURIComponent(content) + '&out_order_no=' + encodeURIComponent(orderNo),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            onload: function(response) {
                try {
                    const result = JSON.parse(response.responseText);
                    callback(result.status === true);
                } catch (e) { callback(true); }
            },
            onerror: function() { callback(false); }
        });
    }

    function collectRiskRemarkData() {
        const wechatBill = (document.getElementById('re-wechat-flow')?.value || '').trim();
        const alipayBill = (document.getElementById('re-alipay-flow')?.value || '').trim();
        const alipayCreditScore = (document.getElementById('re-zhima-credit')?.value || '').trim();
        const huabeiLimit = (document.getElementById('re-huabei-status')?.value || '').trim();
        const fenfuLimit = (document.getElementById('re-wechat-fenfu')?.value || '').trim();
        const douyinPay = (document.getElementById('re-douyin-pay')?.value || '').trim();
        const meituanPay = (document.getElementById('re-meituan-pay')?.value || '').trim();
        const wechatCreditScore = (document.getElementById('re-wechat-credit-score')?.value || '').trim();
        const shareRent = (document.getElementById('re-share-rent')?.value || '').trim();

        let salary = '';
        const workOptionChecked = document.getElementById('re-work-option')?.checked || false;
        if (!workOptionChecked) {
            salary = '无任何工作情况证明';
        } else {
            const workContent = (document.getElementById('re-work-content')?.value || '').trim();
            const workAmount = (document.getElementById('re-work-amount')?.value || '').trim();
            const salaryType = (document.getElementById('re-salary-type')?.value || '').trim();
            const workProofValues = getMultiSelectValues('re-work-proof');
            salary = workContent;
            if (workAmount && salaryType) salary += (salary ? '，' : '') + salaryType + workAmount;
            else if (workAmount) salary += (salary ? '，' : '') + workAmount;
            if (workProofValues.length > 0) {
                salary += (salary ? '，' : '') + workProofValues.join('、');
            } else {
                salary += (salary ? '，' : '') + '无任何工作材料证明此工作';
            }
        }

        let oldDevice = '';
        const oldDeviceChecked = document.getElementById('re-old-device')?.checked;
        if (oldDeviceChecked) {
            const oldDeviceAmount = (document.getElementById('re-old-device-amount')?.value || '').trim();
            oldDevice = oldDeviceAmount ? '旧机置换：' + oldDeviceAmount : '旧机保留';
        } else {
            const oldDeviceType = (document.getElementById('re-old-device-type')?.value || '').trim();
            oldDevice = oldDeviceType || '旧机不保留';
        }

        // 收集原始备注
        let remarkParts = [];
        const otherRemark = (document.getElementById('re-other-remark')?.value || '').trim();
        if (otherRemark) {
            remarkParts.push(otherRemark);
        }

        // 添加审核结果
        const auditPrice = (document.getElementById('re-audit-result')?.value || '').trim();
        const auditResult = (document.getElementById('re-order-result')?.value || '').trim();
        if (auditPrice && auditResult) {
            remarkParts.push((isRestrictAppStoreModel() ? '禁止AppStore：' : '方案一：') + auditPrice + ' ' + auditResult);
        }

        // 添加拓展业务
        const expandChecked = document.getElementById('re-rent-expand')?.checked || false;
        if (expandChecked) {
            const expandType = (document.getElementById('re-expand-type')?.value || '').trim();
            const expandPrice = (document.getElementById('re-expand-result')?.value || '').trim();
            const expandResult = (document.getElementById('re-expand-order-result')?.value || '').trim();
            if (expandType && expandPrice) {
                remarkParts.push(expandType.replace(/：$/, '') + '：' + expandPrice + ' ' + expandResult);
            }
        }

        // 添加降低幅度
        const phoneCostText = (document.getElementById('re-phone-cost')?.value || '').trim();
        const phoneCost = parseFloat(phoneCostText.replace(/[¥,]/g, '')) || 0;
        const auditPriceNum = parseFloat(auditPrice) || 0;
        const v4RiskText = (document.getElementById('re-v4-risk')?.textContent || '').trim();
        const v4Risk = parseFloat(v4RiskText) || 0;

        if (phoneCost > 0 && auditPriceNum > 0 && v4Risk > 0) {
            const ratio1 = auditPriceNum / phoneCost;
            const ratio2 = v4Risk / phoneCost;
            const reductionPercent = ((ratio1 - ratio2) * 100).toFixed(1);

            if (parseFloat(reductionPercent) < 0) {
                remarkParts.push('降低幅度：降低' + Math.abs(reductionPercent) + '%');
            } else {
                remarkParts.push('降低幅度：提高' + reductionPercent + '%');
            }
        }

        // 添加办理方式
        const handleMethod = (document.getElementById('re-handle-method')?.value || '').trim();
        if (handleMethod) {
            remarkParts.push('办理方式：' + handleMethod);
        }

        // 用分号连接所有备注部分
        const finalRemark = remarkParts.join('；');

        return {
            alipayCreditScore: alipayCreditScore,
            wechatCreditScore: wechatCreditScore,
            huabeiLimit: huabeiLimit,
            alipayBill: alipayBill,
            meituanPay: meituanPay,
            fenfuLimit: fenfuLimit,
            wechatBill: wechatBill,
            douyinPay: douyinPay,
            salary: salary,
            shareRent: shareRent,
            oldDevice: oldDevice,
            remark: finalRemark
        };
    }

    function doRiskRemark(orderNo, riskData, callback) {
        const dataParams = {
            operator: '1',
            budget: '',
            old_device: riskData.oldDevice || '',
            alipay_credit_score: riskData.alipayCreditScore || '',
            wechat_credit_score: riskData.wechatCreditScore || '',
            huabei_limit: riskData.huabeiLimit || '',
            alipay_bill: riskData.alipayBill || '',
            meituan_pay: riskData.meituanPay || '',
            fenfu_limit: riskData.fenfuLimit || '',
            wechat_bill: riskData.wechatBill || '',
            douyin_pay: riskData.douyinPay || '',
            salary: riskData.salary || '',
            share_rent: riskData.shareRent || '',
            remark: riskData.remark || '',
            out_order_no: orderNo
        };

        const dataStr = Object.keys(dataParams).map(key =>
            key + '=' + encodeURIComponent(dataParams[key])
        ).join('&');

        GM_xmlhttpRequest({
            method: 'POST',
            url: CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.riskRemark,
            data: dataStr,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            onload: function(response) {
                try {
                    const result = JSON.parse(response.responseText);
                    callback(result.status === true || result.code === 0);
                } catch (e) { callback(true); }
            },
            onerror: function() { callback(false); }
        });
    }

    function getAppearanceSettings() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE.appearanceKey);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }

    function saveAppearanceSettings(settings) {
        try {
            localStorage.setItem(CONFIG.STORAGE.appearanceKey, JSON.stringify(settings));
        } catch (e) {}
    }

    let reFontStyleEl = null;

    function applyFontSettings() {
        const settings = getAppearanceSettings();
        const fontSize = settings.fontSize !== undefined ? settings.fontSize : CONFIG.DEFAULTS.fontSize;
        const fontBold = settings.fontBold !== undefined ? settings.fontBold : CONFIG.DEFAULTS.fontBold;

        document.documentElement.style.setProperty('--re-fs-scale', fontSize / 14);

        if (!reFontStyleEl) {
            reFontStyleEl = document.createElement('style');
            document.head.appendChild(reFontStyleEl);
        }
        reFontStyleEl.textContent = fontBold ? '#re-system-panel, #re-system-panel *, [id^="re-"], [id^="re-"] * { font-weight: 600; }' : '';
    }

    function applyBackgroundSettings() {
        const settings = getAppearanceSettings();
        const bgColor = settings.bgColor || CONFIG.DEFAULTS.bgColor;
        const bgImage = settings.bgImage || '';
        const bgOpacity = settings.bgOpacity !== undefined ? settings.bgOpacity : CONFIG.DEFAULTS.bgOpacity;

        if (panel) {
            if (bgImage) {
                panel.style.background = `url(${bgImage}) center/cover no-repeat`;
                panel.dataset.customBg = 'image';
                if (panel.querySelector('.re-bg-overlay')) {
                    panel.querySelector('.re-bg-overlay').style.opacity = bgOpacity / 100;
                    panel.querySelector('.re-bg-overlay').style.background = bgColor;
                } else {
                    const overlay = document.createElement('div');
                    overlay.className = 're-bg-overlay';
                    overlay.style.cssText = `position:absolute;top:0;left:0;right:0;bottom:0;background:${bgColor};opacity:${bgOpacity/100};pointer-events:none;z-index:0;`;
                    panel.appendChild(overlay);
                }
            } else {
                panel.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -20)} 50%, ${adjustColor(bgColor, -10)} 100%)`;
                panel.dataset.customBg = 'color';
                const overlay = panel.querySelector('.re-bg-overlay');
                if (overlay) overlay.remove();
            }

        }

        updatePreviewCard();
    }

    function adjustColor(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    function updatePreviewCard() {
        const previewInner = document.getElementById('re-bg-preview-inner');
        if (!previewInner) return;

        const settings = getAppearanceSettings();
        const bgColor = settings.bgColor || CONFIG.DEFAULTS.bgColor;
        const bgImage = settings.bgImage || '';
        const bgOpacity = settings.bgOpacity !== undefined ? settings.bgOpacity : CONFIG.DEFAULTS.bgOpacity;

        previewInner.innerHTML = '';
        previewInner.style.position = 'relative';
        previewInner.style.overflow = 'hidden';

        if (bgImage) {
            previewInner.style.background = `url(${bgImage}) center/cover no-repeat`;
            const overlay = document.createElement('div');
            overlay.style.cssText = `position:absolute;top:0;left:0;right:0;bottom:0;background:${bgColor};opacity:${bgOpacity/100}`;
            previewInner.appendChild(overlay);
        } else {
            previewInner.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -20)} 50%, ${adjustColor(bgColor, -10)} 100%)`;
        }
    }

    function initAppearanceSettings() {
        const settings = getAppearanceSettings();

        const colorInput = document.getElementById('re-setting-bg-color');
        const imageInput = document.getElementById('re-setting-bg-image');
        const opacityInput = document.getElementById('re-setting-bg-opacity');
        const opacityValue = document.getElementById('re-opacity-value');
        const imageName = document.getElementById('re-bg-image-name');
        const clearBtn = document.getElementById('re-clear-bg-image');
        const resetBtn = document.getElementById('re-reset-bg-color');

        if (colorInput) {
            colorInput.value = settings.bgColor || CONFIG.DEFAULTS.bgColor;
            colorInput.addEventListener('input', function() {
                const newSettings = getAppearanceSettings();
                newSettings.bgColor = this.value;
                saveAppearanceSettings(newSettings);
                applyBackgroundSettings();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                const newSettings = getAppearanceSettings();
                newSettings.bgColor = CONFIG.DEFAULTS.bgColor;
                saveAppearanceSettings(newSettings);
                if (colorInput) colorInput.value = CONFIG.DEFAULTS.bgColor;
                applyBackgroundSettings();
            });
        }

        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    alert('图片大小不能超过5MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    const newSettings = getAppearanceSettings();
                    newSettings.bgImage = event.target.result;
                    saveAppearanceSettings(newSettings);

                    if (imageName) {
                        imageName.textContent = file.name;
                        imageName.title = file.name;
                    }
                    if (clearBtn) clearBtn.style.display = 'inline-flex';

                    applyBackgroundSettings();
                };
                reader.readAsDataURL(file);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                const newSettings = getAppearanceSettings();
                delete newSettings.bgImage;
                saveAppearanceSettings(newSettings);

                if (imageInput) imageInput.value = '';
                if (imageName) imageName.textContent = '';
                this.style.display = 'none';

                applyBackgroundSettings();
            });
        }

        if (opacityInput && opacityValue) {
            opacityInput.value = settings.bgOpacity !== undefined ? settings.bgOpacity : CONFIG.DEFAULTS.bgOpacity;
            opacityValue.textContent = opacityInput.value + '%';

            opacityInput.addEventListener('input', function() {
                const value = parseInt(this.value, 10);
                if (opacityValue) opacityValue.textContent = value + '%';

                const newSettings = getAppearanceSettings();
                newSettings.bgOpacity = value;
                saveAppearanceSettings(newSettings);

                applyBackgroundSettings();
            });
        }

        const fontSizeInput = document.getElementById('re-setting-font-size');
        const fontSizeValue = document.getElementById('re-font-size-value');
        const fontBoldInput = document.getElementById('re-setting-font-bold');

        if (fontSizeInput && fontSizeValue) {
            fontSizeInput.value = settings.fontSize !== undefined ? settings.fontSize : CONFIG.DEFAULTS.fontSize;
            fontSizeValue.textContent = fontSizeInput.value + 'px';

            fontSizeInput.addEventListener('input', function() {
                const value = parseInt(this.value, 10);
                fontSizeValue.textContent = value + 'px';

                const newSettings = getAppearanceSettings();
                newSettings.fontSize = value;
                saveAppearanceSettings(newSettings);

                applyFontSettings();
            });
        }

        if (fontBoldInput) {
            fontBoldInput.checked = settings.fontBold !== undefined ? settings.fontBold : CONFIG.DEFAULTS.fontBold;

            fontBoldInput.addEventListener('change', function() {
                const newSettings = getAppearanceSettings();
                newSettings.fontBold = this.checked;
                saveAppearanceSettings(newSettings);

                applyFontSettings();
            });
        }

        if (settings.bgImage && imageName) {
            imageName.textContent = '已设置背景图片';
            if (clearBtn) clearBtn.style.display = 'inline-flex';
        }

        updatePreviewCard();
        applyBackgroundSettings();
    }

    function addPanelButton() {
        const viewButton = document.querySelector('button.show-sensitive-data');
        if (!viewButton || viewButton.dataset.panelButtonAdded) return;

        const panelBtn = document.createElement('button');
        panelBtn.type = 'button';
        panelBtn.className = 'layui-btn layui-btn-sm layui-btn-normal re-panel-btn';
        panelBtn.textContent = '面板';
        panelBtn.style.marginLeft = '4px';
        panelBtn.title = '打开系统管理面板';

        panelBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            currentOrderRow = viewButton.closest('#table tbody tr');
            const orderNo = viewButton.dataset.id;
            if (orderNo) {
                if (window.rePanelOrderNo) {
                    window.rePanelOrderNo.value = orderNo;
                }
                togglePanel(true);
            }
        });

        viewButton.insertAdjacentElement('afterend', panelBtn);
        viewButton.dataset.panelButtonAdded = 'true';
    }

    const panelBtnStyle = document.createElement('style');
    panelBtnStyle.textContent = `
        .re-panel-btn {
            font-size: 12px;
            padding: 0 10px;
            height: 28px;
            line-height: 28px;
            border-radius: 2px;
            cursor: pointer;
        }
        .re-panel-btn:hover {
            opacity: 0.85;
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(panelBtnStyle);

    addPanelButton();
    applyFontSettings();

    function initAnalysisEvents() {
        const analysisRangeSelect = document.getElementById('re-analysis-range');
        if (analysisRangeSelect) {
            analysisRangeSelect.addEventListener('change', renderAnalysisData);
        }

        const modelRangeSelect = document.getElementById('re-model-range');
        if (modelRangeSelect) {
            modelRangeSelect.addEventListener('change', renderModelAnalysis);
        }
    }

    window.addEventListener('resize', () => {
        if (lazyInit.analysis) {
            const analysisPage = document.getElementById('re-page-analysis');
            if (analysisPage && analysisPage.style.display !== 'none') {
                renderAnalysisData();
                renderModelAnalysis();
            }
        }
    });

})();
