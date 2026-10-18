// ==UserScript==
// @name         系统管理面板
// @namespace    http://tampermonkey.net/
// @version      7.2.7
// @description  系统管理面板
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
            zhimaAutoSubmitKey: 're-zhima-auto-submit-enabled',
            liushuiBaoMemoryKey: 're-liushui-bao-memory-enabled',
            liushuiBaoStateKey: 're-liushui-bao-state',
            autoRefreshKey: 're-auto-refresh-enabled',
            lowPerfKey: 're-low-perf-enabled',
            restDaysKey: 're-rest-days',
            editedDaysKey: 're-edited-days'
        },
        DEFAULTS: {
            bgColor: '#e8eaed',
            bgOpacity: 80,
            fontSize: 14,
            fontBold: false,
            headerBg: '#6b7280',   // 标题栏背景色（默认深灰渐变主色）
            headerTextColor: '#ffffff', // 标题栏文字颜色
            switchOnColor: '#3b82f6',  // 开关激活色（默认蓝，自动亮30%生成渐变）
            inputTint: 0,              // 输入框染色浓度（0-100%，默认0=不染色，100=与开关同色）
            glassMode: true,           // 磨砂模式（三栏白底+模糊）；关闭=全透明清晰透出壁纸
            compWhiteBg: true,         // 交互组件白底（输入框/下拉/表单卡片等）；关闭=透明保留边框
            compOpacity: 80            // 组件背景板透明度（表单卡片/信息卡/联系人/风控预览/工作流条）
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
                    <span class="re-panel-version">V7.2.7</span>
                    <span class="re-review-energy" id="re-review-energy" style="display:none;"><span class="re-review-energy-bar"><span class="re-review-energy-fill"></span><span class="re-review-energy-pct">0%</span></span><span class="re-review-energy-count">0/0</span></span>
                </div>
                <span class="re-header-data">【客户办单：数据丢失】 你 0岁 数据丢失【SJMM旗舰店】</span>
                <div class="re-panel-header-right">
                    <span class="re-panel-staff" id="re-staff-name"></span>
                </div>
            </div>
            <div class="re-panel-resize-handle"></div>
            <div class="re-drag-ghost">
                <span class="re-drag-ghost-text">移动中...</span>
                <button class="re-drag-cancel" id="re-drag-cancel-btn">取消移动</button>
            </div>
            <div class="re-panel-content">
                <div class="re-column re-column-left">
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
                            <li class="re-nav-item" data-page="review" title="审查中心">
                                <svg class="re-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="re-column re-column-center">
                    <div class="re-column-content" id="re-main-content">
                        <div class="re-form-section" id="re-page-data">
                            <div class="re-form-group">
                                <div class="re-form-title">基础选项</div>
                                <div class="re-form-row">
                                    <div class="re-form-item-inline">
                                        <label class="re-form-label">流水宝</label>
                                        <div class="re-form-inline">
                                            <label class="re-switch">
                                                <input type="checkbox" id="re-liushui-bao">
                                                <span class="re-switch-slider"></span>
                                            </label>
                                        </div>
                                    </div>
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
                                                </div>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="re-form-group">
                                <div class="re-form-title">流水信息</div>
                                <div class="re-flow-grid re-flow-grid-5 re-flow-section">
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
                                        <label class="re-form-label">支宝资产</label>
                                        <input type="text" class="re-input re-input-mini" id="re-alipay-assets" placeholder="请输入">
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
                                        <label class="re-form-label">微信余额</label>
                                        <input type="text" class="re-input re-input-mini" id="re-wechat-balance" placeholder="请输入">
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">手机成本</label>
                                        <div class="re-price-wrapper">
                                            <input type="text" class="re-input re-input-mini re-phone-cost-input" id="re-phone-cost" value="--" readonly>
                                            <span class="re-price-diff-container" id="re-phone-cost-diff"></span>
                                        </div>
                                    </div>
                                    <div class="re-flow-item">
                                        <label class="re-form-label">指导价格</label>
                                        <input type="text" class="re-input re-input-mini re-guide-price-input" id="re-guide-price" value="--" readonly>
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
                                        <span class="re-data-value" id="re-product-info">--</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">最低首付</span>
                                        <span class="re-data-value" id="re-min-down-payment">--</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">套餐信息</span>
                                        <span class="re-data-value" id="re-package-info">--</span>
                                    </div>
                                    <div class="re-data-row">
                                        <span class="re-data-label">办单次数</span>
                                        <span class="re-data-value" id="re-shop-order-count">-- 次</span>
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
                                        <div class="re-data-form-row" id="re-audit-row">
                                            <div class="re-data-form-inline">
                                                <label class="re-form-label" id="re-audit-price-label">审核价格</label>
                                                <input type="text" class="re-input re-price-input" id="re-audit-result" placeholder="请输入">
                                            </div>
                                            <div class="re-data-form-inline">
                                                <label class="re-form-label">审核结果</label>
                                                <select class="re-select" id="re-order-result">
                                                    <option>通过</option>
                                                    <option>无锁通过</option>
                                                    <option selected>考虑</option>
                                                    <option>取消</option>
                                                    <option>支付不了</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="re-data-form-row">
                                            <div class="re-data-form-inline re-expand-result-row">
                                                <label class="re-form-label" id="re-expand-price-label">拓展价格</label>
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
                                            <div class="re-data-form-inline" id="re-expand-switch-inline">
                                                <label class="re-form-label" id="re-expand-switch-label">拓展</label>
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
                                        <div class="re-set2-grid">
                                            <div class="re-set2-card">
                                                <div class="re-set2-card-head"><span class="re-set2-dot" style="background:#3b82f6;"></span><span class="re-set2-card-name">订单自动化</span><span class="re-set2-card-count">3</span></div>
                                                <div class="re-set2-row" title="打开面板时自动获取订单信息">
                                                    <div class="re-setting-icon re-setting-icon-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
                                                    <div class="re-set2-line"><span class="re-setting-name">自动获取订单</span><span class="re-set2-inline-desc">打开面板时自动获取订单信息</span></div>
                                                    <label class="re-switch re-switch-small">
                                                        <input type="checkbox" id="re-setting-auto-fetch">
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                                <div class="re-set2-row" title="根据身份证号自动计算年龄">
                                                    <div class="re-setting-icon re-setting-icon-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                                                    <div class="re-set2-line"><span class="re-setting-name">自动年龄</span><span class="re-set2-inline-desc">根据身份证号自动计算年龄</span></div>
                                                    <label class="re-switch re-switch-small">
                                                        <input type="checkbox" id="re-setting-auto-age">
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                                <div class="re-set2-row" title="打开面板时自动查询手机号使用时长">
                                                    <div class="re-setting-icon re-setting-icon-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                                                    <div class="re-set2-line"><span class="re-setting-name">自动查询联系人</span><span class="re-set2-inline-desc">自动查询手机号使用时长</span></div>
                                                    <label class="re-switch re-switch-small">
                                                        <input type="checkbox" id="re-setting-auto-contact-query">
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="re-set2-card">
                                                <div class="re-set2-card-head"><span class="re-set2-dot" style="background:#22c55e;"></span><span class="re-set2-card-name">提交与刷新</span><span class="re-set2-card-count">3</span></div>
                                                <div class="re-set2-row" title="点自动处理时，将芝麻信用提交到风控报告">
                                                    <div class="re-setting-icon re-setting-icon-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                                                    <div class="re-set2-line"><span class="re-setting-name">主动提交芝麻分</span><span class="re-set2-inline-desc">提交到风控报告</span></div>
                                                    <div class="re-appearance-control">
                                                        <button class="re-zhima-test-btn" id="re-zhima-test-btn" title="手动测试一次芝麻分提交链路">测试提交</button>
                                                        <label class="re-switch re-switch-small">
                                                            <input type="checkbox" id="re-setting-zhima-submit">
                                                            <span class="re-switch-slider"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="re-set2-row" title="自动处理完成后自动刷新页面">
                                                    <div class="re-setting-icon re-setting-icon-cyan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></div>
                                                    <div class="re-set2-line"><span class="re-setting-name">自动刷新</span><span class="re-set2-inline-desc">处理完成后自动刷新页面</span></div>
                                                    <label class="re-switch re-switch-small">
                                                        <input type="checkbox" id="re-setting-auto-refresh" checked>
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                                <div class="re-set2-row" title="芝麻信用有数据时刷新页面需确认">
                                                    <div class="re-setting-icon re-setting-icon-orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                                                    <div class="re-set2-line"><span class="re-setting-name">防手误刷新</span><span class="re-set2-inline-desc">有芝麻分时刷新需确认</span></div>
                                                    <label class="re-switch re-switch-small">
                                                        <input type="checkbox" id="re-setting-prevent-refresh">
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="re-set2-card re-set2-card-full">
                                                <div class="re-set2-card-head"><span class="re-set2-dot" style="background:#f97316;"></span><span class="re-set2-card-name">系统</span><span class="re-set2-card-count">2</span></div>
                                                <div class="re-set2-half">
                                                    <div class="re-set2-slot" title="开启后流水宝开关跨订单保持，关闭则每单重置">
                                                        <div class="re-setting-icon re-setting-icon-cyan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                                                        <div class="re-set2-line"><span class="re-setting-name">流水宝记忆</span><span class="re-set2-inline-desc">开关状态跨订单保持</span></div>
                                                        <label class="re-switch re-switch-small">
                                                            <input type="checkbox" id="re-setting-liushui-bao-memory">
                                                            <span class="re-switch-slider"></span>
                                                        </label>
                                                    </div>
                                                    <div class="re-set2-slot" title="禁用模糊和动画，提升Chrome流畅度">
                                                        <div class="re-setting-icon re-setting-icon-red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                                                        <div class="re-set2-line"><span class="re-setting-name">低性能模式</span><span class="re-set2-inline-desc">禁用模糊动画提升流畅度</span></div>
                                                        <label class="re-switch re-switch-small">
                                                            <input type="checkbox" id="re-setting-low-perf">
                                                            <span class="re-switch-slider"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="re-set2-staff" id="re-setting-staff-name-card">
                                            <div class="re-setting-icon re-setting-icon-indigo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                                            <div class="re-set2-line"><span class="re-setting-name">修改姓名</span><span class="re-set2-inline-desc" id="re-setting-staff-desc">当前：未设置</span></div>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:#9ca3af;flex-shrink:0;"><polyline points="15 3 21 9 9 21H3v-6L15 3z"/></svg>
                                        </div>
                                    </div>
                                    <div class="re-settings-panel" id="re-settings-appearance">
                                        <div class="re-appearance-cols">
                                        <div class="re-appearance-main">
                                        <div class="re-set2-card">
                                            <div class="re-set2-card-head"><span class="re-set2-dot" style="background:#a855f7;"></span><span class="re-set2-card-name">配色</span><span class="re-set2-card-count">5</span></div>
                                            <div class="re-color-grid">
                                                <div class="re-color-cell" title="自定义面板背景颜色">
                                                    <div class="re-color-cell-ctl">
                                                        <input type="color" id="re-setting-bg-color" value="#e8eaed" class="re-color-picker">
                                                        <button class="re-reset-icon-btn" id="re-reset-bg-color" title="重置为默认"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>
                                                    </div>
                                                    <span class="re-color-label">背板颜色</span>
                                                </div>
                                                <div class="re-color-cell" title="自定义顶部标题栏背景">
                                                    <div class="re-color-cell-ctl">
                                                        <input type="color" id="re-setting-header-bg" value="#6b7280" class="re-color-picker">
                                                        <button class="re-reset-icon-btn" id="re-reset-header-bg" title="重置为默认"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>
                                                    </div>
                                                    <span class="re-color-label">标题栏背景色</span>
                                                </div>
                                                <div class="re-color-cell" title="标题、客户数据、客服名字色">
                                                    <div class="re-color-cell-ctl">
                                                        <input type="color" id="re-setting-header-text" value="#ffffff" class="re-color-picker">
                                                        <button class="re-reset-icon-btn" id="re-reset-header-text" title="重置为默认"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>
                                                    </div>
                                                    <span class="re-color-label">标题栏文字颜色</span>
                                                </div>
                                                <div class="re-color-cell" title="所有开关打开时的颜色">
                                                    <div class="re-color-cell-ctl">
                                                        <input type="color" id="re-setting-switch-color" value="#3b82f6" class="re-color-picker">
                                                        <button class="re-reset-icon-btn" id="re-reset-switch-color" title="重置为默认"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>
                                                    </div>
                                                    <span class="re-color-label">开关激活色</span>
                                                </div>
                                            </div>
                                            <div class="re-set2-slider-row" title="输入框/下拉背景跟随开关激活色的深浅">
                                                <span class="re-setting-name">输入框染色</span>
                                                <input type="range" id="re-setting-input-tint" min="0" max="100" value="100" class="re-range-slider">
                                                <span id="re-input-tint-value" class="re-opacity-text">100%</span>
                                            </div>
                                        </div>
                                        <div class="re-set2-card">
                                            <div class="re-set2-card-head"><span class="re-set2-dot" style="background:#f97316;"></span><span class="re-set2-card-name">背景与质感</span><span class="re-set2-card-count">5</span></div>
                                            <div class="re-set2-row" title="选图后可裁剪、缩放、拉伸">
                                                <div class="re-setting-icon re-setting-icon-orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                                                <div class="re-set2-line"><span class="re-setting-name">背景图片</span><span class="re-set2-inline-desc">选图后可裁剪、缩放、拉伸</span></div>
                                                <div class="re-appearance-control">
                                                    <span id="re-bg-image-name" class="re-filename-text"></span>
                                                    <label class="re-file-upload-btn" id="re-bg-image-upload-label">
                                                        选择图片
                                                        <input type="file" id="re-setting-bg-image" accept="image/jpeg,image/png,image/webp" style="display:none">
                                                    </label>
                                                    <button class="re-btn-sm re-btn-danger" id="re-clear-bg-image" style="display:none;">清除</button>
                                                </div>
                                            </div>
                                            <div class="re-set2-half">
                                                <div class="re-set2-slot">
                                                    <span class="re-setting-name">背景透明度</span>
                                                    <input type="range" id="re-setting-bg-opacity" min="0" max="100" value="80" class="re-range-slider">
                                                    <span id="re-opacity-value" class="re-opacity-text">80%</span>
                                                </div>
                                                <div class="re-set2-slot">
                                                    <span class="re-setting-name">组件透明度</span>
                                                    <input type="range" id="re-setting-comp-opacity" min="0" max="100" value="80" class="re-range-slider">
                                                    <span id="re-comp-opacity-value" class="re-opacity-text">80%</span>
                                                </div>
                                            </div>
                                            <div class="re-set2-half">
                                                <div class="re-set2-slot">
                                                    <div class="re-set2-line"><span class="re-setting-name">磨砂模式</span></div>
                                                    <label class="re-switch re-switch-small">
                                                        <input type="checkbox" id="re-setting-glass-mode" checked>
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                                <div class="re-set2-slot">
                                                    <div class="re-set2-line"><span class="re-setting-name">交互组件白底</span></div>
                                                    <label class="re-switch re-switch-small">
                                                        <input type="checkbox" id="re-setting-comp-white-bg" checked>
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="re-set2-card">
                                            <div class="re-set2-card-head"><span class="re-set2-dot" style="background:#ec4899;"></span><span class="re-set2-card-name">字体</span><span class="re-set2-card-count">2</span></div>
                                            <div class="re-set2-row">
                                                <div class="re-setting-icon re-setting-icon-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg></div>
                                                <div class="re-set2-line"><span class="re-setting-name">字体大小</span><span class="re-set2-inline-desc">面板文字大小 · 右侧开关为加粗</span></div>
                                                <div class="re-appearance-control" style="flex:1;max-width:200px;">
                                                    <input type="range" id="re-setting-font-size" min="12" max="18" step="1" value="14" class="re-range-slider" style="flex:1;min-width:0;">
                                                    <span id="re-font-size-value" class="re-opacity-text">14px</span>
                                                    <label class="re-switch re-switch-small" title="字体加粗">
                                                        <input type="checkbox" id="re-setting-font-bold">
                                                        <span class="re-switch-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                        <div class="re-appearance-side">
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
                        <div class="re-form-section" id="re-page-review" style="display: none;">
                            <div class="re-review-container" id="re-review-container">
                                <div class="re-review-empty">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>
                                    <div class="re-review-empty-text">审查中心暂无待审查数据</div>
                                    <div class="re-review-empty-tip">请到【历史订单】点击日期卡片上的【审查此列】按钮<br>将该日客户移入审查中心进行批量审查</div>
                                </div>
                            </div>
                        </div>
                        <div class="re-form-section" id="re-page-analysis" style="display: none;">
                            <div class="re-analysis-container">
                                <div class="re-analysis-topbar">
                                    <span class="re-analysis-pagetitle">数据分析</span>
                                    <div class="re-range-tabs" id="re-analysis-range">
                                        <button type="button" class="re-rtab" data-range="7d">近7天</button>
                                        <button type="button" class="re-rtab" data-range="14d">近14天</button>
                                        <button type="button" class="re-rtab on" data-range="month">本月</button>
                                        <button type="button" class="re-rtab" data-range="lastmonth">上月</button>
                                    </div>
                                </div>
                                <div class="re-analysis-overview">
                                    <div class="re-ov-card">
                                        <div class="re-ov-value" id="re-stat-total">0</div>
                                        <div class="re-ov-label" id="re-analysis-month-label">本月总量</div>
                                        <div class="re-ov-delta" id="re-ov-total-delta" style="display:none;"></div>
                                    </div>
                                    <div class="re-ov-card">
                                        <div class="re-ov-value" id="re-stat-daily-avg">0</div>
                                        <div class="re-ov-label" id="re-avg-label">工作日日均</div>
                                        <div class="re-ov-delta" id="re-ov-avg-delta" style="display:none;"></div>
                                    </div>
                                    <div class="re-ov-card re-stat-rate">
                                        <div class="re-ov-value re-ov-rate" id="re-stat-pass-rate">--</div>
                                        <div class="re-ov-label" id="re-rate-label">本月通过率</div>
                                        <div class="re-ov-delta" id="re-rate-delta" style="display:none;"></div>
                                    </div>
                                    <div class="re-ov-card re-stat-high">
                                        <div class="re-ov-value" id="re-stat-max-orders">0</div>
                                        <div class="re-ov-label" id="re-stat-max-date">最高</div>
                                    </div>
                                    <div class="re-ov-card re-stat-low">
                                        <div class="re-ov-value" id="re-stat-min-orders">0</div>
                                        <div class="re-ov-label" id="re-stat-min-date">最低</div>
                                    </div>
                                </div>
                                <div class="re-analysis-section">
                                    <div class="re-analysis-header">
                                        <span class="re-analysis-title">每日通过率波动</span>
                                        <div class="re-rate-legend">
                                            <span class="re-rate-lg"><i class="re-rate-dot g"></i>已审查日</span>
                                            <span class="re-rate-lg"><i class="re-rate-dot r"></i>0% 全未通过</span>
                                            <span class="re-rate-lg"><i class="re-rate-dot h"></i>断点=当日未审查</span>
                                        </div>
                                    </div>
                                    <div class="re-chart-card">
                                        <canvas id="re-rate-chart"></canvas>
                                        <div id="re-rate-tooltip" class="re-chart-tooltip" style="display: none;"></div>
                                    </div>
                                </div>
                                <div class="re-analysis-divider"></div>
                                <div class="re-analysis-two">
                                    <div class="re-analysis-section">
                                        <div class="re-analysis-header">
                                            <span class="re-analysis-title">订单趋势分析</span>
                                        </div>
                                        <div class="re-chart-card">
                                            <canvas id="re-order-chart"></canvas>
                                            <div id="re-chart-tooltip" class="re-chart-tooltip" style="display: none;"></div>
                                        </div>
                                    </div>
                                    <div class="re-analysis-section">
                                        <div class="re-analysis-header">
                                            <span class="re-analysis-title">机型审核量分析</span>
                                            <div class="re-range-tabs" id="re-model-range">
                                                <button type="button" class="re-rtab on" data-top="5">Top 5</button>
                                                <button type="button" class="re-rtab" data-top="10">Top 10</button>
                                            </div>
                                        </div>
                                        <div id="re-model-chart-wrap" class="re-model-chart-wrap"></div>
                                        <div class="re-model-legend" id="re-model-legend"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="re-column re-column-right" id="re-right-column">
                    <div class="re-column-content">
                        <div class="re-info-card">
                            <div class="re-info-title">监管机信息</div>
                            <div class="re-info-list">
                                <div class="re-info-item">
                                    <span class="re-info-label">机型</span>
                                    <span class="re-info-value" id="re-device-model">--</span>
                                </div>
                                <div class="re-info-item">
                                    <span class="re-info-label">价格</span>
                                    <span class="re-info-value" id="re-device-price">--</span>
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
                            <button class="re-action-btn" id="re-btn-view-report">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                查看报告
                            </button>
                            <button class="re-action-btn" id="re-btn-auto-process">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 4 12 14.01 9 11.01"/><circle cx="12" cy="12" r="10"/></svg>
                                自动处理
                            </button>
                            <button class="re-action-btn" id="re-btn-no-lock">
                                <svg class="re-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                                无锁模式
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
                        <!-- 工作流预览：常驻展示自动处理将执行的节点链 -->
                        <div class="re-workflow-bar re-workflow-hidden" id="re-workflow-bar">
                            <div class="re-workflow-title">工作流<span class="re-workflow-hint" id="re-workflow-hint"> · 点自动处理时执行</span></div>
                            <div class="re-workflow-nodes" id="re-workflow-nodes"></div>
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
        <!-- 背景图裁剪弹窗：按面板宽高比取景，滚轮/按钮缩放 + 拖动平移 -->
        <div class="re-modal-overlay" id="re-bg-crop-modal">
            <div class="re-modal re-modal-bg-crop">
                <div class="re-modal-header">
                    <span class="re-modal-title">裁剪背景图片</span>
                    <button class="re-modal-close" id="re-bg-crop-close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="re-modal-content">
                    <div class="re-bg-crop-viewport" id="re-bg-crop-viewport">
                        <img id="re-bg-crop-img" draggable="false" alt="">
                        <div class="re-bg-crop-grid"></div>
                    </div>
                    <div class="re-bg-crop-toolbar">
                        <button class="re-btn re-btn-default" id="re-bg-crop-zoom-out" title="缩小">−</button>
                        <span class="re-bg-crop-scale" id="re-bg-crop-scale-text">100%</span>
                        <button class="re-btn re-btn-default" id="re-bg-crop-zoom-in" title="放大">＋</button>
                        <button class="re-btn re-btn-default" id="re-bg-crop-reset">适配</button>
                        <button class="re-btn re-btn-default" id="re-bg-crop-cover" title="恰好铺满取景框，不留空白">满铺</button>
                        <button class="re-btn re-btn-default" id="re-bg-crop-stretch" title="拉伸图片填满取景框（宽高比不同会变形）">拉伸</button>
                        <span class="re-bg-crop-hint">滚轮缩放 · 拖动调整位置</span>
                        <span style="flex:1"></span>
                        <button class="re-btn re-btn-default" id="re-bg-crop-cancel">取消</button>
                        <button class="re-btn re-btn-primary" id="re-bg-crop-ok">确认裁剪</button>
                    </div>
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
                <div class="re-modal-content re-repeat-modal-content">
                    <div class="re-model-orders-list" id="re-repeat-orders-list"></div>
                    <div class="re-bill-panel" id="re-bill-panel">
                        <div class="re-bill-panel-title">账单详情</div>
                        <div class="re-bill-panel-body" id="re-bill-panel-body">
                            <div class="re-bill-panel-empty">点击订单卡片右侧「账单」按钮<br>在此查看扣款信息</div>
                        </div>
                    </div>
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
            /* 标题栏背景/文字颜色：外观设置可覆盖（变量在 #re-system-panel 上定义） */
            background: linear-gradient(135deg, var(--re-header-bg-1, rgba(107, 114, 128, 0.95)) 0%, var(--re-header-bg-2, rgba(75, 85, 99, 0.95)) 100%);
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
            color: var(--re-header-text, #ffffff);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .re-panel-version {
            font-size: 11px;
            font-weight: 600;
            padding: 3px 10px;
            border-radius: 999px;
            background: rgba(24, 24, 27, 0.82);
            border: 1px solid rgba(255, 255, 255, 0.14);
            color: #d4d4d8;
            letter-spacing: 0.3px;
            white-space: nowrap;
        }

        .re-panel-header-right {
            display: flex;
            align-items: center;
            margin-left: auto; /* 右组整体贴右 */
        }

        .re-panel-staff {
            font-size: 12px;
            color: var(--re-header-text, rgba(255, 255, 255, 0.85));
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
            /* 提升独立合成层：backdrop-filter 的模糊采样结果可被浏览器缓存，
               面板内滚动/输入不再触发三栏大面积重模糊（拖拽/滚动卡顿主因） */
            transform: translateZ(0);
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

        /* 客户数据：并入深色顶栏，居中自适应省略 */
        .re-header-data {
            flex: 1;
            min-width: 0;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            color: var(--re-header-text, rgba(255, 255, 255, 0.92));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0 12px;
        }

        /* 复购客户：金色高亮 + 闪烁提示 */
        .re-header-data.highlight-gold {
            color: #fbbf24;
            animation: re-header-gold-flash 0.7s ease-in-out 3;
        }

        @keyframes re-header-gold-flash {
            0%, 100% { opacity: 1; text-shadow: none; }
            50% { opacity: 0.55; text-shadow: 0 0 10px rgba(251, 191, 36, 0.8); }
        }

        .re-new-chain-link {
            display: inline-block;
            background: rgba(24, 24, 27, 0.82);
            border: 1px solid rgba(255, 255, 255, 0.14);
            color: #d4d4d8;
            font-size: 13px;
            padding: 2px 9px;
            border-radius: 999px;
            margin-right: 6px;
            font-weight: 600;
            vertical-align: middle;
            white-space: nowrap;
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
        .re-expand-badges .re-repeat-customer {
            margin-right: 0;
            margin-left: 0;
        }

        /* 无锁模式胶囊：达标绿 / 未达标灰 */
        .re-nolock-badge {
            display: inline-block;
            font-size: 13px;
            padding: 1px 8px;
            border-radius: 4px;
            margin-left: 6px;
            font-weight: 600;
            vertical-align: middle;
            cursor: default;
            user-select: none;
            white-space: nowrap;
        }

        .re-expand-badges .re-nolock-badge {
            margin-right: 0;
            margin-left: 0;
        }

        .re-nolock-badge.re-nolock-badge-ok {
            background: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
        }

        .re-nolock-badge.re-nolock-badge-no {
            background: #f3f4f6;
            color: #6b7280;
            border: 1px solid #e5e7eb;
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
            background: var(--re-accent-10, rgba(59, 130, 246, 0.1));
            color: var(--re-accent-dark, #2563eb);
        }

        .re-nav-item.active {
            background: linear-gradient(135deg, var(--re-accent-20, rgba(59, 130, 246, 0.2)) 0%, var(--re-accent-15, rgba(96, 165, 250, 0.15)) 100%);
            color: var(--re-accent-dark, #1d4ed8);
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
            background: var(--re-input-bg, rgba(255, 255, 255, 0.6));
            color: #374151;
            outline: none;
        }

        .re-history-search-input:focus {
            border-color: var(--re-switch-on-1, #3b82f6);
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

        /* 月通过率胶囊（审查结果绿标占比，与「已通过」审查胶囊同绿色系） */
        .re-history-month-rate {
            font-size: 12px;
            font-weight: 600;
            color: #16a34a;
            background: #dcfce7;
            padding: 3px 8px;
            border-radius: 6px;
            white-space: nowrap;
            flex-shrink: 0;
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
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
            gap: 12px;
        }

        .re-history-day-card {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            border: 1px solid rgba(107, 114, 128, 0.15);
            overflow: hidden;
            min-width: 0;
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

        /* 当日通过率胶囊（审查结果绿标占比，与「已通过」审查胶囊同绿色系） */
        .re-history-day-rate {
            font-size: 11px;
            font-weight: 600;
            color: #16a34a;
            background: #dcfce7;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            flex-shrink: 0;
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
            width: 100%;
            margin-top: 2px;
            padding: 5px 0;
            border: 1px dashed rgba(107, 114, 128, 0.35);
            background: transparent;
            color: #6b7280;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            font-family: inherit;
            transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }

        .re-history-day-more:hover {
            background: rgba(59, 130, 246, 0.08);
            border-color: rgba(59, 130, 246, 0.4);
            color: #3b82f6;
        }

        .re-history-day-collapse {
            width: 100%;
            margin-top: 2px;
            padding: 5px 0;
            border: 1px dashed rgba(107, 114, 128, 0.35);
            background: transparent;
            color: #6b7280;
            border-radius: 6px;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            font-family: inherit;
            transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }

        .re-history-day-collapse:hover {
            background: rgba(59, 130, 246, 0.08);
            border-color: rgba(59, 130, 246, 0.4);
            color: #3b82f6;
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
            display: flex;
            align-items: center;
            gap: 7px;
            background: rgba(249, 250, 251, 0.8);
            border-radius: 8px;
            padding: 5px 26px 5px 7px;
            cursor: default;
            border: 1px solid transparent;
            position: relative;
            transition: background 0.12s ease, border-color 0.12s ease;
        }

        .re-history-item:hover {
            background: rgba(59, 130, 246, 0.08);
            border-color: rgba(59, 130, 246, 0.2);
        }

        .re-history-item-hidden {
            display: none;
        }

        .re-history-item-name {
            font-size: 12px;
            font-weight: 600;
            color: #1f2937;
            flex-shrink: 0;
            max-width: 72px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .re-history-item-time {
            font-size: 11px;
            color: #6b7280;
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            flex-shrink: 0;
        }

        .re-history-item-model {
            font-size: 11px;
            color: #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            padding: 1px 7px;
            border-radius: 4px;
            max-width: 118px;
            min-width: 0;
            flex-shrink: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .re-history-item-shop {
            font-size: 11px;
            color: #6b7280;
            background: rgba(107, 114, 128, 0.1);
            padding: 1px 7px;
            border-radius: 4px;
            max-width: 104px;
            min-width: 0;
            flex-shrink: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* 历史记录标签胶囊（下单时的胶囊快照） */
        .re-history-item-tags {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            margin-left: auto;
            min-width: 0;
            overflow: hidden;
            flex-shrink: 1;
            padding-right: 18px;
        }

        .re-history-tag {
            display: inline-flex;
            align-items: center;
            font-size: 10px;
            font-weight: 600;
            padding: 1px 6px;
            border-radius: 999px;
            white-space: nowrap;
            flex-shrink: 0;
            line-height: 1.5;
        }

        .re-history-tag-nolock {
            background: #dbeafe;
            color: #1d4ed8;
        }

        .re-history-tag-repeat {
            background: #3b82f6;
            color: #fff;
        }

        .re-history-tag-risk {
            background: #fee2e2;
            color: #dc2626;
        }

        /* 浮卡内的标签胶囊（稍大） */
        .re-history-hover-card-tags .re-history-tag {
            font-size: 12px;
            padding: 2px 8px;
        }

        /* 月份标题右侧：按标签筛选下拉 */
        .re-history-tag-filter {
            font-size: 11px;
            color: #374151;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 2px 4px;
            height: 24px;
            cursor: pointer;
            outline: none;
            max-width: 108px;
            flex-shrink: 0;
        }

        .re-history-tag-filter:focus {
            border-color: #93c5fd;
        }

        /* 筛选无结果的空态：保留下拉操作栏，可切换/清除筛选 */
        .re-history-empty-filter {
            display: flex;
            justify-content: center;
            margin-top: 10px;
        }

        .re-history-item-delete {
            position: absolute;
            right: 4px;
            top: 50%;
            transform: translateY(-50%);
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
            opacity: 0;
            transition: opacity 0.12s ease;
        }

        .re-history-item:hover .re-history-item-delete {
            opacity: 1;
        }

        .re-history-item-delete:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }

        .re-history-item-delete svg {
            width: 12px;
            height: 12px;
        }

        /* Lightbox 模态遮罩：仅放大态点亮，盖住面板（后插入 DOM 同层级居上），点击即收起 */
        .re-history-hover-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.28);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.18s linear;
            z-index: 2147483647;
        }

        .re-history-hover-backdrop.show {
            opacity: 1;
            pointer-events: auto;
        }

        /* ===== 风控预览详情 Lightbox（V6.7.0）：点击风控预览展开的分组浮窗 ===== */
        .re-risk-detail-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.28);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.18s linear;
            z-index: 2147483647;
        }

        .re-risk-detail-backdrop.show {
            opacity: 1;
            pointer-events: auto;
        }

        .re-risk-detail-card {
            position: fixed;
            width: min(600px, 92vw);
            background: #ffffff;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
            opacity: 0;
            pointer-events: none;
            transform: scale(0.92);
            transform-origin: left top;
            transition: opacity 0.18s linear, transform 0.18s linear, box-shadow 0.18s linear, left 0.18s linear, top 0.18s linear;
            z-index: 2147483647;
            overflow: hidden;
        }

        .re-risk-detail-card.show {
            opacity: 1;
            pointer-events: auto;
            user-select: text;
            cursor: default;
        }

        /* 放大态：居中屏幕（inline 定位被 !important 覆盖，过渡产生从预览生长到中央的动画） */
        .re-risk-detail-card.zoomed {
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) scale(1);
            transform-origin: center center;
            box-shadow: 0 16px 44px rgba(0, 0, 0, 0.22);
        }

        .re-risk-detail-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 18px 10px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.14);
        }

        .re-risk-detail-title {
            font-size: 15px;
            font-weight: 600;
            color: #18181b;
        }

        .re-risk-detail-close {
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 8px;
            background: rgba(107, 114, 128, 0.08);
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s linear, color 0.15s linear;
        }

        .re-risk-detail-close:hover {
            background: rgba(107, 114, 128, 0.16);
            color: #18181b;
        }

        .re-risk-detail-close svg {
            width: 15px;
            height: 15px;
        }

        .re-risk-detail-body {
            padding: 12px 18px 16px;
            overflow-y: auto;
            max-height: calc(72vh - 62px);
        }

        .re-risk-detail-section {
            margin-bottom: 14px;
        }

        .re-risk-detail-section:last-child {
            margin-bottom: 0;
        }

        .re-risk-detail-section-title {
            font-size: 12px;
            font-weight: 600;
            color: #9ca3af;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.12);
        }

        .re-risk-detail-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 3px 0;
            font-size: 13.5px;
            line-height: 1.55;
        }

        .re-risk-detail-label {
            flex-shrink: 0;
            color: #6b7280;
            white-space: nowrap;
        }

        .re-risk-detail-value {
            flex: 1;
            color: #18181b;
            word-break: break-all;
        }

        .re-risk-detail-row-plain {
            display: block;
            color: #18181b;
        }

        .re-history-hover-card {
            position: fixed;
            width: 300px;
            background: #ffffff;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
            padding: 10px 12px;
            pointer-events: none;
            opacity: 0;
            transform: translateY(6px) scale(0.9);
            /* 仅合成器属性过渡：left/top/width 等布局属性由 JS 直接定位，不参与动画 */
            transition: opacity 0.16s linear, transform 0.16s linear, box-shadow 0.16s linear;
            z-index: 2147483647;
        }

        .re-history-hover-card.show {
            opacity: 1;
            transform: translateY(0) scale(1);
            transform-origin: left center;
            pointer-events: auto;
            user-select: text;
            cursor: default;
        }

        .re-history-hover-card.flip-left {
            transform-origin: right center;
        }

        /* 点击记录行/小卡片后放大到主面板 60% 大小（39vw × 42vh）居中屏幕，Lightbox 模态：
           点击卡片外部任意处 / 点击卡片本体或 ✕ / 按 Esc 收起（不再依据鼠标移动轨迹判定） */
        .re-history-hover-card.zoomed {
            left: 50% !important;
            top: 50% !important;
            width: 39vw;
            min-height: 42vh;
            padding: 24px 28px;
            transform: translate(-50%, -50%) scale(1);
            transform-origin: center center;
            box-shadow: 0 16px 44px rgba(0, 0, 0, 0.22);
            display: flex;
            flex-direction: column;
            justify-content: center;
            /* Lightbox 放大为一次性动画，保留布局过渡保证放大平滑 */
            transition: opacity 0.16s linear, transform 0.16s linear, box-shadow 0.16s linear, left 0.16s linear, top 0.16s linear, width 0.16s linear, min-height 0.16s linear, padding 0.16s linear;
        }

        .re-history-hover-card.zoomed .re-history-hover-card-name {
            font-size: 22px;
        }

        .re-history-hover-card.zoomed .re-history-hover-card-time {
            font-size: 14px;
        }

        .re-history-hover-card.zoomed .re-history-hover-card-tags {
            margin-top: 10px;
        }

        .re-history-hover-card.zoomed .re-history-hover-card-model,
        .re-history-hover-card.zoomed .re-history-hover-card-shop {
            font-size: 14px;
            padding: 3px 10px;
        }

        .re-history-hover-card.zoomed .re-history-hover-card-remark {
            font-size: 15px;
            max-height: 24vh;
            margin-top: 14px;
            padding: 12px 14px;
        }

        .re-history-hover-card.zoomed .re-history-hover-card-remark-label {
            font-size: 13px;
        }

        /* 放大态右上角 ✕ 收起按钮，小卡片态不显示 */
        .re-history-hover-card-close {
            display: none;
            position: absolute;
            top: 12px;
            right: 14px;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 8px;
            background: rgba(107, 114, 128, 0.1);
            color: #6b7280;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            padding: 0;
            transition: background 0.15s, color 0.15s;
        }

        .re-history-hover-card-close:hover {
            background: rgba(107, 114, 128, 0.2);
            color: #374151;
        }

        .re-history-hover-card-close svg {
            width: 14px;
            height: 14px;
        }

        .re-history-hover-card.zoomed .re-history-hover-card-close {
            display: flex;
        }

        .re-history-hover-card-head {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }

        .re-history-hover-card-name {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
        }

        .re-history-hover-card-time {
            font-size: 11px;
            color: #6b7280;
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        }

        .re-history-hover-card-tags {
            display: flex;
            gap: 6px;
            margin-top: 6px;
            flex-wrap: wrap;
        }

        .re-history-hover-card-model {
            font-size: 11px;
            color: #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            padding: 1px 7px;
            border-radius: 4px;
            white-space: nowrap;
        }

        .re-history-hover-card-shop {
            font-size: 11px;
            color: #6b7280;
            background: rgba(107, 114, 128, 0.1);
            padding: 1px 7px;
            border-radius: 4px;
            white-space: nowrap;
        }

        .re-history-hover-card-remark {
            margin-top: 8px;
            padding: 6px 8px;
            background: rgba(243, 244, 246, 0.9);
            border-left: 2px solid #3b82f6;
            border-radius: 6px;
            font-size: 11px;
            color: #4b5563;
            line-height: 1.6;
            word-break: break-all;
            max-height: 120px;
            overflow-y: auto;
        }

        .re-history-hover-card-remark-label {
            display: block;
            font-size: 10px;
            font-weight: 600;
            color: #3b82f6;
            margin-bottom: 2px;
        }

        .re-form-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .re-form-group {
            background: var(--re-comp-bg, rgba(255, 255, 255, 0.8));
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

        /* 总览卡（分析页顶部独立行） */
        .re-analysis-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 16px;
        }

        .re-ov-card {
            background: #fff;
            border-radius: 10px;
            padding: 12px 14px;
            border: 1px solid rgba(107, 114, 128, 0.1);
        }

        .re-ov-card.re-stat-high {
            border-left: 3px solid #10b981;
        }

        .re-ov-card.re-stat-low {
            border-left: 3px solid #f59e0b;
        }

        .re-ov-value {
            font-size: 22px;
            font-weight: 600;
            color: #374151;
            line-height: 1.2;
        }

        .re-ov-value .re-ov-unit {
            font-size: 13px;
            color: #9ca3af;
            font-weight: 400;
        }

        .re-ov-label {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 2px;
        }

        .re-ov-delta {
            font-size: 11px;
            font-weight: 600;
            margin-top: 4px;
        }

        .re-ov-delta.up { color: #10b981; }
        .re-ov-delta.down { color: #ef4444; }
        .re-ov-delta.flat { color: #9ca3af; font-weight: 400; }

        /* 分析页顶部全局范围栏（范围选择器联动所有图表与 KPI） */
        .re-analysis-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
            border: 1px solid rgba(107, 114, 128, 0.15);
            border-radius: 10px;
            padding: 10px 16px;
            margin-bottom: 16px;
        }

        .re-analysis-pagetitle {
            font-size: 15px;
            font-weight: 600;
            color: #374151;
        }

        /* 订单趋势 + 机型审核量 双列并排（面板宽度不足时自动退化为单列） */
        .re-analysis-two {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 12px;
        }

        /* 通过率 KPI 卡（绿边绿字） */
        .re-ov-card.re-stat-rate {
            border-left: 3px solid #16a34a;
        }

        .re-ov-value.re-ov-rate {
            color: #16a34a;
        }

        /* 通过率波动图图例 */
        .re-rate-legend {
            display: flex;
            gap: 10px;
            margin-left: auto;
        }

        .re-rate-lg {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #6b7280;
        }

        .re-rate-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            flex-shrink: 0;
        }

        .re-rate-dot.g { background: #16a34a; }
        .re-rate-dot.r { background: #dc2626; }
        .re-rate-dot.h { background: none; border: 1px dashed #9ca3af; }

        /* 范围分段标签 */
        .re-range-tabs {
            display: flex;
            gap: 4px;
            margin-left: auto;
        }

        .re-rtab {
            height: 26px;
            padding: 0 12px;
            border: 1px solid rgba(107, 114, 128, 0.25);
            border-radius: 6px;
            background: #fff;
            color: #6b7280;
            font-size: 12px;
            font-family: inherit;
            cursor: pointer;
            transition: background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease;
        }

        .re-rtab:hover {
            border-color: #3b82f6;
            color: #3b82f6;
        }

        .re-rtab.on {
            background: #3b82f6;
            border-color: #3b82f6;
            color: #fff;
            font-weight: 600;
        }

        /* 机型横向条形图 */
        .re-model-chart-wrap {
            background: #fff;
            border-radius: 10px;
            padding: 14px 16px;
            border: 1px solid rgba(107, 114, 128, 0.12);
            display: grid;
            gap: 6px;
        }

        .re-model-empty {
            text-align: center;
            color: #9ca3af;
            font-size: 13px;
            padding: 30px 0;
        }

        .re-mbar-item {
            display: grid;
            gap: 4px;
        }

        .re-mbar-row {
            display: grid;
            grid-template-columns: 120px 1fr 84px;
            align-items: center;
            gap: 10px;
            padding: 3px 4px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.1s ease;
        }

        .re-mbar-row:hover {
            background: rgba(59, 130, 246, 0.06);
        }

        .re-mbar-row.expanded {
            background: rgba(59, 130, 246, 0.08);
        }

        .re-mbar-name {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .re-mbar-track {
            height: 22px;
            border-radius: 5px;
            background: rgba(107, 114, 128, 0.08);
            overflow: hidden;
        }

        .re-mbar-fill {
            height: 100%;
            border-radius: 5px;
            display: flex;
            align-items: center;
            padding-left: 8px;
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            transition: width 0.5s ease;
        }

        .re-mbar-meta {
            font-size: 11px;
            color: #9ca3af;
            text-align: right;
            font-variant-numeric: tabular-nums;
        }

        .re-mbar-meta b {
            color: #4b5563;
        }

        /* 展开态：机型每日审核量柱状图 */
        .re-mdaily-box {
            display: flex;
            align-items: flex-end;
            gap: 3px;
            height: 64px;
            padding: 6px 6px 0;
            margin-left: 130px;
            margin-right: 94px;
            border-left: 1px solid rgba(107, 114, 128, 0.15);
            border-bottom: 1px solid rgba(107, 114, 128, 0.15);
            border-radius: 0 0 4px 4px;
            position: relative;
        }

        .re-mdaily-col {
            flex: 1;
            min-width: 0;
            background: linear-gradient(180deg, #60a5fa, #3b82f6);
            border-radius: 2px 2px 0 0;
            position: relative;
            transition: filter 0.1s ease;
            animation: reMbarColIn 0.3s ease both;
        }

        @keyframes reMbarColIn {
            from { transform: scaleY(0); transform-origin: bottom; }
            to { transform: scaleY(1); transform-origin: bottom; }
        }

        .re-mdaily-col.zero {
            background: rgba(107, 114, 128, 0.15);
        }

        .re-mdaily-col:hover {
            filter: brightness(1.15);
        }

        /* 悬停提示 */
        .re-mdaily-col::before {
            content: attr(data-tip);
            position: absolute;
            bottom: calc(100% + 6px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(31, 41, 55, 0.95);
            color: #fff;
            font-size: 10px;
            padding: 3px 7px;
            border-radius: 4px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.1s ease;
            z-index: 5;
        }

        .re-mdaily-col:hover::before {
            opacity: 1;
        }

        /* 日期标签（挂在柱子下方，稀疏显示） */
        .re-mdaily-col::after {
            content: attr(data-label);
            position: absolute;
            top: calc(100% + 3px);
            left: 50%;
            transform: translateX(-50%);
            font-size: 9px;
            color: #9ca3af;
            white-space: nowrap;
        }

        .re-mbar-item:has(.re-mdaily-box) {
            padding-bottom: 18px;
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

        /* ===== 设置区 V2 布局：组卡网格 + 行内描述 ===== */
        .re-set2-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .re-set2-card {
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(107, 114, 128, 0.08);
            border-radius: 10px;
            overflow: hidden;
        }

        .re-set2-card-full {
            grid-column: 1 / -1;
        }

        .re-set2-card-head {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(107, 114, 128, 0.06);
        }

        .re-set2-dot {
            width: 7px;
            height: 7px;
            border-radius: 999px;
            flex-shrink: 0;
        }

        .re-set2-card-name {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            letter-spacing: 1px;
        }

        .re-set2-card-count {
            margin-left: auto;
            font-size: 10px;
            color: #9ca3af;
            background: rgba(107, 114, 128, 0.08);
            padding: 1px 7px;
            border-radius: 999px;
        }

        .re-set2-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-top: 1px solid rgba(107, 114, 128, 0.06);
        }

        .re-set2-line {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: baseline;
            gap: 6px;
        }

        .re-set2-inline-desc {
            flex: 1;
            min-width: 0;
            font-size: 11px;
            color: #9ca3af;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .re-set2-half {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-top: 1px solid rgba(107, 114, 128, 0.06);
        }

        .re-set2-half > .re-set2-slot + .re-set2-slot {
            border-left: 1px solid rgba(107, 114, 128, 0.06);
        }

        .re-set2-slot {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            min-width: 0;
        }

        .re-set2-slot .re-range-slider {
            flex: 1;
            min-width: 0;
        }

        .re-set2-slider-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-top: 1px solid rgba(107, 114, 128, 0.06);
        }

        .re-set2-slider-row .re-setting-name {
            flex-shrink: 0;
        }

        .re-set2-slider-row .re-range-slider {
            flex: 1;
            min-width: 0;
        }

        .re-set2-staff {
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(107, 114, 128, 0.08);
            border-radius: 10px;
            cursor: pointer;
            transition: background .15s, border-color .15s;
        }

        .re-set2-staff:hover {
            background: rgba(255, 255, 255, 0.9);
            border-color: rgba(107, 114, 128, 0.15);
        }

        /* 行内小号图标：复用 re-setting-icon 色系，仅覆盖尺寸 */
        .re-set2-row .re-setting-icon,
        .re-set2-slot .re-setting-icon,
        .re-set2-staff .re-setting-icon {
            width: 28px;
            height: 28px;
            border-radius: 7px;
        }

        .re-set2-row .re-setting-icon svg,
        .re-set2-slot .re-setting-icon svg,
        .re-set2-staff .re-setting-icon svg {
            width: 15px;
            height: 15px;
        }

        /* 设置区开关放大：抵消 small 缩放，升级 44x24 中号触控尺寸（激活色仍走 re-switch 的变量渐变） */
        .re-set2-row .re-switch-small,
        .re-set2-slot .re-switch-small,
        .re-appearance-main .re-switch-small {
            transform: none;
            width: 44px;
            height: 24px;
        }

        .re-set2-row .re-switch-small .re-switch-slider,
        .re-set2-slot .re-switch-small .re-switch-slider,
        .re-appearance-main .re-switch-small .re-switch-slider {
            border-radius: 24px;
        }

        .re-set2-row .re-switch-small .re-switch-slider:before,
        .re-set2-slot .re-switch-small .re-switch-slider:before,
        .re-appearance-main .re-switch-small .re-switch-slider:before {
            width: 18px;
            height: 18px;
            left: 3px;
            bottom: 3px;
        }

        .re-set2-row .re-switch-small input:checked + .re-switch-slider:before,
        .re-set2-slot .re-switch-small input:checked + .re-switch-slider:before,
        .re-appearance-main .re-switch-small input:checked + .re-switch-slider:before {
            transform: translateX(20px);
        }

        /* 芝麻分测试提交：描述下方的文字链接式按钮，保持卡片右侧只有开关 */
        .re-zhima-test-btn {
            display: inline-block;
            margin-top: 3px;
            padding: 0;
            border: none;
            background: none;
            font-size: 11px;
            font-weight: 600;
            color: #3b82f6;
            cursor: pointer;
            transition: color .15s;
        }

        .re-zhima-test-btn:hover {
            color: #2563eb;
            text-decoration: underline;
        }

        .re-zhima-test-btn:disabled {
            cursor: not-allowed;
            opacity: 0.6;
            color: #6b7280;
            text-decoration: none;
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

        .re-setting-name {
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            display: block;
        }

        .re-switch-small {
            transform: scale(0.85);
            transform-origin: right center;
        }

        /* ===== 外观 V2：左控件右预览双栏 ===== */
        .re-appearance-cols {
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }

        .re-appearance-main {
            flex: 1.6;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .re-appearance-side {
            flex: 1;
            min-width: 0;
        }

        /* 配色色块格：取色器+重置一行，名称在下 */
        .re-color-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 10px;
            padding: 10px 12px;
        }

        .re-color-cell {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .re-color-cell-ctl {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .re-color-cell-ctl .re-color-picker {
            flex: 1;
            min-width: 0;
            width: auto;
        }

        .re-color-label {
            font-size: 11px;
            color: #6b7280;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .re-appearance-control {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* 紧凑圆形重置按钮：替代占宽的「重置」文字按钮 */
        .re-reset-icon-btn {
            width: 26px;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 1px solid #d1d5db;
            border-radius: 50%;
            background: #f9fafb;
            color: #6b7280;
            cursor: pointer;
            flex-shrink: 0;
            transition: background .15s, color .15s, border-color .15s, transform .25s;
        }

        .re-reset-icon-btn:hover {
            background: #f3f4f6;
            color: #374151;
            border-color: #9ca3af;
            transform: rotate(-60deg);
        }

        .re-reset-icon-btn svg {
            width: 13px;
            height: 13px;
            stroke-width: 2;
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

        /* 上传按钮：中性灰描边，与设置区其他按钮统一 */
        .re-file-upload-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 5px 12px;
            font-size: 12px;
            color: #374151;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
            transition: background .15s, border-color .15s;
        }

        .re-file-upload-btn:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
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

        /* 非「已买断」状态：订单号标红 */
        .re-repeat-order-no-red {
            color: #dc2626;
            font-weight: 600;
        }

        /* 未完结胶囊（订单号右侧，非「已买断」状态显示） */
        .re-repeat-unfinished-badge {
            display: inline-block;
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
            font-size: 11px;
            font-weight: 600;
            padding: 0 6px;
            border-radius: 4px;
            margin-left: 6px;
            vertical-align: middle;
            white-space: nowrap;
            cursor: pointer;
            transition: background .15s, border-color .15s;
        }

        .re-repeat-unfinished-badge:hover {
            background: #fee2e2;
            border-color: #fca5a5;
        }

        .re-current-order-badge {
            display: inline-block;
            background: #eff6ff;
            color: #2563eb;
            border: 1px solid #bfdbfe;
            font-size: 11px;
            font-weight: 600;
            padding: 0 6px;
            border-radius: 4px;
            margin-left: 6px;
            vertical-align: middle;
        }

        .re-model-order-current {
            background: rgba(59, 130, 246, 0.06);
            border-color: rgba(59, 130, 246, 0.35);
            border-left: 3px solid #3b82f6;
        }

        .re-model-order-current:hover {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.45);
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

        .re-flow-grid-5 {
            grid-template-columns: repeat(5, 1fr);
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
            background: var(--re-input-bg, rgba(255, 255, 255, 0.9));
            width: 100%;
        }

        .re-input:focus {
            outline: none;
            border-color: var(--re-switch-on-1, #3b82f6);
            box-shadow: 0 0 0 3px var(--re-focus-ring, rgba(59, 130, 246, 0.1));
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
            background: var(--re-input-bg, rgba(255, 255, 255, 0.9));
            cursor: pointer;
        }

        .re-select:focus {
            outline: none;
            border-color: var(--re-switch-on-1, #3b82f6);
            box-shadow: 0 0 0 3px var(--re-focus-ring, rgba(59, 130, 246, 0.1));
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
            min-width: 200px;
            max-width: 280px;
            vertical-align: middle;
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
            background: var(--re-input-bg, rgba(255, 255, 255, 0.9));
            cursor: pointer;
            gap: 8px;
        }

        .re-multi-select-header:hover {
            border-color: var(--re-switch-on-1, #3b82f6);
        }

        .re-multi-select.open .re-multi-select-header {
            border-color: var(--re-switch-on-1, #3b82f6);
            box-shadow: 0 0 0 3px var(--re-focus-ring, rgba(59, 130, 246, 0.1));
        }

        .re-multi-select-text {
            flex: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .re-multi-select-arrow {
            width: 14px;
            height: 14px;
            color: #9ca3af;
            flex-shrink: 0;
            transition: transform 0.15s ease;
        }

        .re-multi-select.open .re-multi-select-arrow {
            transform: rotate(180deg);
        }

        /* 宽下拉面板：挂 body、fixed 定位（JS 计算坐标），560px 两列网格 */
        .re-multi-select-dropdown {
            position: fixed;
            width: 560px;
            max-width: calc(100vw - 16px);
            background: #ffffff;
            border: 1px solid rgba(107, 114, 128, 0.2);
            border-radius: 10px;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
            z-index: 2147483647;
            display: none;
        }

        .re-multi-select-dropdown.open {
            display: block;
            animation: reMsDdIn 0.14s ease;
        }

        @keyframes reMsDdIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .re-multi-select-items {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            padding: 6px;
            max-height: 320px;
            overflow-y: auto;
        }

        .re-multi-select-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.1s ease;
            min-width: 0;
        }

        .re-multi-select-item:hover {
            background: rgba(59, 130, 246, 0.08);
        }

        .re-multi-select-item input {
            display: none;
        }

        .re-multi-select-box {
            width: 17px;
            height: 17px;
            flex-shrink: 0;
            border: 1.5px solid rgba(107, 114, 128, 0.35);
            border-radius: 4.5px;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.1s ease, border-color 0.1s ease;
        }

        .re-multi-select-box svg {
            width: 11px;
            height: 11px;
            color: #ffffff;
            opacity: 0;
            transform: scale(0.5);
            transition: opacity 0.1s ease, transform 0.1s ease;
        }

        .re-multi-select-item.sel .re-multi-select-box {
            background: #3b82f6;
            border-color: #3b82f6;
        }

        .re-multi-select-item.sel .re-multi-select-box svg {
            opacity: 1;
            transform: scale(1);
        }

        .re-multi-select-item-text {
            font-size: 13px;
            color: #374151;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
        }

        .re-multi-select-foot {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 8px 6px 14px;
            border-top: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-multi-select-count {
            font-size: 12px;
            color: #6b7280;
            margin-right: auto;
        }

        .re-multi-select-foot-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 12px;
            color: #6b7280;
            padding: 6px 9px;
            border-radius: 6px;
            transition: background-color 0.1s ease, color 0.1s ease;
            font-family: inherit;
        }

        .re-multi-select-foot-btn:hover {
            background: rgba(59, 130, 246, 0.08);
            color: #3b82f6;
        }

        .re-multi-select-foot-btn svg {
            width: 13px;
            height: 13px;
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

        /* ===== 多选「管理选项」弹窗（独立前缀，不与可编辑下拉的管理弹窗共用） ===== */
        .re-msmanage-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2147483650;
            display: none;
        }

        .re-msmanage-modal.show {
            display: block;
        }

        .re-msmanage-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ffffff;
            border-radius: 12px;
            width: 460px;
            max-width: calc(100vw - 32px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
        }

        .re-msmanage-head {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px 16px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.15);
        }

        .re-msmanage-title {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
        }

        .re-msmanage-count {
            font-size: 12px;
            color: #6b7280;
            background: rgba(107, 114, 128, 0.1);
            padding: 2px 8px;
            border-radius: 99px;
        }

        .re-msmanage-close {
            margin-left: auto;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: #9ca3af;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.1s ease, color 0.1s ease;
        }

        .re-msmanage-close:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }

        .re-msmanage-close svg {
            width: 14px;
            height: 14px;
        }

        .re-msmanage-add {
            display: flex;
            gap: 8px;
            padding: 12px 16px 4px;
        }

        .re-msmanage-input {
            flex: 1;
            height: 36px;
            padding: 0 10px;
            border: 1px solid rgba(107, 114, 128, 0.25);
            border-radius: 8px;
            font-size: 13px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.1s ease, box-shadow 0.1s ease;
        }

        .re-msmanage-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .re-msmanage-addbtn {
            height: 36px;
            padding: 0 14px;
            border: none;
            border-radius: 8px;
            background: #3b82f6;
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: filter 0.1s ease;
        }

        .re-msmanage-addbtn:hover {
            filter: brightness(1.08);
        }

        .re-msmanage-addbtn svg {
            width: 13px;
            height: 13px;
        }

        .re-msmanage-hint {
            padding: 6px 16px 0;
            font-size: 11px;
            color: #9ca3af;
        }

        .re-msmanage-list {
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-height: 300px;
            overflow-y: auto;
            min-height: 80px;
        }

        .re-msmanage-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 10px 10px 8px;
            background: rgba(249, 250, 251, 0.9);
            border: 1px solid transparent;
            border-radius: 8px;
            cursor: grab;
            transition: background-color 0.12s ease, border-color 0.12s ease;
            font-size: 13px;
        }

        .re-msmanage-item.custom {
            background: rgba(59, 130, 246, 0.06);
        }

        .re-msmanage-item:hover {
            border-color: rgba(59, 130, 246, 0.35);
        }

        .re-msmanage-item.dragging {
            opacity: 0.45;
            border: 1px dashed #3b82f6;
        }

        .re-msmanage-item.drag-over {
            border: 1px solid #3b82f6;
            box-shadow: 0 -2px 0 0 #3b82f6;
        }

        .re-msmanage-grip {
            color: #9ca3af;
            display: flex;
            cursor: grab;
        }

        .re-msmanage-grip:active {
            cursor: grabbing;
        }

        .re-msmanage-grip svg {
            width: 12px;
            height: 14px;
        }

        .re-msmanage-num {
            width: 18px;
            height: 18px;
            border-radius: 5px;
            background: #ffffff;
            border: 1px solid rgba(107, 114, 128, 0.2);
            font-size: 10px;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .re-msmanage-text {
            flex: 1;
            color: #374151;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .re-msmanage-tag {
            font-size: 10px;
            padding: 1px 7px;
            border-radius: 4px;
            flex-shrink: 0;
        }

        .re-msmanage-tag.def {
            background: rgba(245, 158, 11, 0.12);
            border: 1px solid rgba(245, 158, 11, 0.35);
            color: #b45309;
        }

        .re-msmanage-tag.cus {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
        }

        .re-msmanage-lock {
            color: #9ca3af;
            display: flex;
            flex-shrink: 0;
        }

        .re-msmanage-lock svg {
            width: 13px;
            height: 13px;
        }

        .re-msmanage-del {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            border: none;
            border-radius: 5px;
            background: transparent;
            color: #9ca3af;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: background-color 0.1s ease, color 0.1s ease, opacity 0.1s ease;
        }

        .re-msmanage-item:hover .re-msmanage-del {
            opacity: 1;
        }

        .re-msmanage-del:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }

        .re-msmanage-del svg {
            width: 12px;
            height: 12px;
        }

        .re-msmanage-foot {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-top: 1px solid rgba(107, 114, 128, 0.15);
            background: rgba(249, 250, 251, 0.6);
        }

        .re-msmanage-note {
            font-size: 11px;
            color: #9ca3af;
            margin-right: auto;
        }

        .re-msmanage-reset {
            height: 30px;
            padding: 0 12px;
            border: 1px solid rgba(107, 114, 128, 0.25);
            border-radius: 8px;
            background: #ffffff;
            color: #6b7280;
            font-size: 12px;
            font-family: inherit;
            cursor: pointer;
            transition: background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease;
        }

        .re-msmanage-reset:hover {
            border-color: #ef4444;
            color: #ef4444;
            background: rgba(239, 68, 68, 0.06);
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
            background: var(--re-comp-bg, rgba(255, 255, 255, 0.8));
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
            background: var(--re-comp-bg, rgba(255, 255, 255, 0.8));
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

        /* ===== 工作流预览（蛇形节点链）===== */
        .re-workflow-bar {
            margin-top: 12px;
            padding: 10px 12px;
            background: var(--re-comp-bg, rgba(255, 255, 255, 0.8));
            border-radius: 10px;
            border: 1px solid rgba(107, 114, 128, 0.15);
            overflow: hidden;
            max-height: 200px;
            transition: opacity 0.25s ease, max-height 0.25s ease, margin 0.25s ease, padding 0.25s ease;
        }

        .re-workflow-bar.re-workflow-hidden {
            opacity: 0;
            max-height: 0;
            margin-top: 0;
            padding-top: 0;
            padding-bottom: 0;
            border: none;
        }

        .re-workflow-title {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(107, 114, 128, 0.12);
        }

        /* 预览态提示：处理进行中自动隐藏 */
        .re-workflow-hint {
            font-size: 10px;
            font-weight: 400;
            color: #9ca3af;
            margin-left: 4px;
        }

        /* 蛇形容器：各行纵向排列 */
        .re-workflow-nodes {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .re-wf-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }

        /* 奇数行反向：蛇从右往左爬 */
        .re-wf-row-reverse {
            flex-direction: row-reverse;
        }

        /* 行间转折竖线 */
        .re-wf-corner {
            position: relative;
            width: 100%;
            height: 14px;
            flex-shrink: 0;
        }

        .re-wf-corner::before {
            content: '';
            position: absolute;
            top: -4px;
            height: 22px;
            width: 2px;
            border-radius: 2px;
            background: #d1d5db;
        }

        .re-wf-corner-right::before { right: 32px; }
        .re-wf-corner-left::before { left: 32px; }

        .re-wf-corner.lit::before { background: #3b82f6; }

        .re-workflow-node {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            padding: 3px 9px;
            border-radius: 999px;
            white-space: nowrap;
            line-height: 1.4;
            flex-shrink: 0;
        }

        /* 未执行：浅灰空心 */
        .re-workflow-node.pending {
            background: #f3f4f6;
            color: #9ca3af;
            border: 1px dashed #d1d5db;
        }

        /* 进行中：天蓝呼吸 */
        .re-workflow-node.running {
            background: #dbeafe;
            color: #1d4ed8;
            border: 1px solid #93c5fd;
            animation: re-workflow-breath 1.2s ease-in-out infinite;
        }

        /* 成功：天蓝实底 */
        .re-workflow-node.done {
            background: #3b82f6;
            color: #fff;
            border: 1px solid #3b82f6;
        }

        /* 失败：灰黑实底 */
        .re-workflow-node.failed {
            background: #1f2937;
            color: #f9fafb;
            border: 1px solid #111827;
        }

        /* 跳过：浅灰实底 */
        .re-workflow-node.skipped {
            background: #e5e7eb;
            color: #6b7280;
            border: 1px solid #d1d5db;
        }

        /* 行内连线：自适应填满两侧节点之间的整个间隙 */
        .re-workflow-link {
            flex: 1;
            min-width: 10px;
            height: 2px;
            background: #d1d5db;
            border-radius: 2px;
        }

        .re-workflow-link.lit {
            background: #3b82f6;
        }

        @keyframes re-workflow-breath {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.55; }
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
            max-height: calc(1.6em * 3);
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
            white-space: pre-line; /* 支持主行+拓展行两行展示 */
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
            background: var(--re-comp-bg, rgba(255, 255, 255, 0.8));
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
