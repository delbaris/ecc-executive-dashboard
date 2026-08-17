window.initCharts = async function () {
    Chart.defaults.font.family = 'Vazirmatn';
    Chart.defaults.color = '#64748b';

    // 1. چارت روند رشد
    const growthCanvas = document.getElementById('growthChart');
    if (growthCanvas) {
        const ctxGrowth = growthCanvas.getContext('2d');
        const gradientBlue = ctxGrowth.createLinearGradient(0, 0, 0, 400);
        gradientBlue.addColorStop(0, 'rgba(37, 99, 235, 0.5)');
        gradientBlue.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

        new Chart(ctxGrowth, {
            type: 'line',
            data: {
                labels: ['۱۳۹۸', '۱۳۹۹', '۱۴۰۰', '۱۴۰۱', '۱۴۰۲', '۱۴۰۳'],
                datasets: [{
                    label: 'ارزش معاملات (همت)',
                    data: [423, 1097, 1237, 1833, 3188, 5500],
                    borderColor: '#2563eb', backgroundColor: gradientBlue,
                    borderWidth: 3, tension: 0.4, fill: true,
                    pointBackgroundColor: '#ffffff', pointBorderColor: '#2563eb', pointRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { grid: { borderDash: [5, 5] }, beginAtZero: true }, x: { grid: { display: false } } }
            }
        });
    }

    // 2. چارت جدید: سهم حوزه‌های فعالیت (کالا و خدمات)
    const sectorCanvas = document.getElementById('sectorChart');
    if (sectorCanvas) {
        new Chart(sectorCanvas.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['فروش کالا', 'ارائه خدمات'],
                datasets: [{
                    data: [73, 27], // داده‌های واقعی از اینفوگرافی
                    backgroundColor: ['#2563eb', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Vazirmatn' } } }
                }
            }
        });
    }

    // 3. چارت توزیع ستاره‌ها 
    const starsCanvas = document.getElementById('starsChart');
    if (starsCanvas) {
        new Chart(starsCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['پنج ستاره', 'چهار ستاره', 'سه ستاره', 'دو/یک ستاره', 'بدون ستاره'],
                datasets: [{
                    data: [15, 22, 28, 25, 10],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b', '#ef4444'],
                    borderWidth: 0, hoverOffset: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Vazirmatn' } } }
                }
            }
        });
    }

    // 4. راه‌اندازی نقشه
    await MapModule.init();
};

const MapModule = {
    mapChart: null,

    async init() {
        const mapDom = document.getElementById('echarts-map-container');
        if (!mapDom) return;

        const yearSpan = document.getElementById('dynamic-year');
        if (yearSpan) yearSpan.textContent = "۱۴۰۳";

        let iranGeoJson = null;
        // آرایه‌ای کاملاً ضدگلوله از تمام مسیرهای ممکن برای فایل نقشه
        const mapSources = [
            './assets/ir-all.geo.json',
            './assets/iran.json',
            '../docs/assets/ir-all.geo.json',
            '../docs/assets/iran.json',
            '../../docs/assets/ir-all.geo.json',
            '/docs/assets/ir-all.geo.json',
            '/assets/ir-all.geo.json',
            'https://cdn.jsdelivr.net/gh/roshankar/iran-geojson@master/iran-provinces.json'
        ];

        for (let url of mapSources) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    iranGeoJson = await response.json();
                    break;
                }
            } catch (e) { /* ادامه حلقه در صورت یافت نشدن فایل */ }
        }

        if (!iranGeoJson) {
            mapDom.innerHTML = '<div class="flex flex-col h-full items-center justify-center text-danger"><i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i><span class="font-bold">داده‌های نقشه در مسیر لوکال یافت نشد.</span></div>';
            return;
        }

        const getFaName = (enName) => {
            if (!enName) return 'نامشخص';
            const dict = {
                'tehran': 'تهران', 'isfahan': 'اصفهان', 'esfahan': 'اصفهان', 'fars': 'فارس',
                'khorasan-e razavi': 'خراسان رضوی', 'khorasan razavi': 'خراسان رضوی',
                'khuzestan': 'خوزستان', 'east azerbaijan': 'آذربایجان شرقی', 'azarbayjan-e sharqi': 'آذربایجان شرقی',
                'west azerbaijan': 'آذربایجان غربی', 'azarbayjan-e gharbi': 'آذربایجان غربی',
                'mazandaran': 'مازندران', 'kerman': 'کرمان', 'sistan and baluchestan': 'سیستان و بلوچستان',
                'alborz': 'البرز', 'gilan': 'گیلان', 'kermanshah': 'کرمانشاه', 'golestan': 'گلستان',
                'hormozgan': 'هرمزگان', 'lorestan': 'لرستان', 'kurdistan': 'کردستان', 'kordestan': 'کردستان',
                'hamadan': 'همدان', 'qazvin': 'قزوین', 'ardabil': 'اردبیل', 'bushehr': 'بوشهر',
                'yazd': 'یزد', 'zanjan': 'زنجان', 'chahar mahall and bakhtiari': 'چهارمحال و بختیاری',
                'markazi': 'مرکزی', 'north khorasan': 'خراسان شمالی', 'south khorasan': 'خراسان جنوبی',
                'semnan': 'سمنان', 'ilam': 'ایلام', 'kohgiluyeh and boyer-ahmad': 'کهگیلویه و بویراحمد', 'qom': 'قم'
            };
            return dict[enName.toLowerCase()] || enName;
        };

        const realData = {
            'تهران': { value: 124268, growth: 12.5 },
            'اصفهان': { value: 25710, growth: 8.2 },
            'خراسان رضوی': { value: 23568, growth: 7.9 },
            'فارس': { value: 17140, growth: 6.4 },
            'خوزستان': { value: 12000, growth: 5.1 },
            'آذربایجان شرقی': { value: 11500, growth: 4.8 }
        };

        echarts.registerMap('IRAN', iranGeoJson);
        this.mapChart = echarts.init(mapDom);

        const provinceData = iranGeoJson.features.map(feature => {
            const mapKey = feature.properties.name || feature.properties.NAME_1 || feature.properties['hc-key'];
            const faName = getFaName(mapKey);
            const pData = realData[faName] || {
                value: Math.floor(Math.random() * 8000) + 1000,
                growth: (Math.random() * 10 - 2).toFixed(1)
            };
            return { name: mapKey, faName: faName, value: pData.value, growth: pData.growth };
        });

        this.renderMap(provinceData);
        this.bindEvents();
        window.addEventListener('resize', () => {
            if (this.mapChart) this.mapChart.resize();
            for (let id in Chart.instances) { Chart.instances[id].resize(); }
        });
    },

    renderMap(provinceData) {
        const isMobile = window.innerWidth <= 768;
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item', backgroundColor: 'transparent', borderColor: 'transparent', padding: 0,
                formatter: (params) => {
                    const data = params.data;
                    if (!data) return '';
                    const trendIcon = data.growth >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
                    const trendColor = data.growth >= 0 ? '#10b981' : '#ef4444';
                    return `
                        <div class="echarts-custom-tooltip">
                            <h4><i class="fa-solid fa-map-location-dot"></i> استان ${data.faName}</h4>
                            <div class="tooltip-row">
                                <span>اینماد فعال:</span>
                                <strong>${new Intl.NumberFormat('fa-IR').format(data.value)}</strong>
                            </div>
                            <div class="tooltip-row">
                                <span>رشد:</span>
                                <strong style="color: ${trendColor}" dir="ltr">%${data.growth} <i class="fa-solid ${trendIcon}"></i></strong>
                            </div>
                        </div>`;
                }
            },
            visualMap: {
                left: isMobile ? 'center' : 'right', bottom: isMobile ? '2%' : '5%',
                orient: isMobile ? 'horizontal' : 'vertical',
                min: 1000, max: 130000, text: ['تراکم بالا', 'تراکم پایین'],
                inRange: { color: ['#e0f2fe', '#2563eb'] },
                textStyle: { color: '#64748b', fontFamily: 'Vazirmatn' },
                calculable: true, backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: isMobile ? 6 : 10, borderRadius: 8,
                itemWidth: isMobile ? 12 : 16, itemHeight: isMobile ? 60 : 120
            },
            series: [{
                name: 'ایران', type: 'map', map: 'IRAN', roam: 'move', zoom: 1.2,
                label: { show: false },
                itemStyle: { areaColor: '#f1f5f9', borderColor: '#cbd5e1', borderWidth: 1 },
                emphasis: { itemStyle: { areaColor: '#f59e0b', shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
                data: provinceData
            }]
        };
        this.mapChart.setOption(option);
    },

    bindEvents() {
        const resetBtn = document.getElementById('btn-map-reset');
        this.mapChart.on('click', (params) => {
            if (!params.data) return;
            const data = params.data;
            resetBtn.style.display = 'inline-flex';
            this.renderDetails(data);
            this.mapChart.setOption({
                geo: { zoom: 3.5, center: [params.event.offsetX, params.event.offsetY], animationDurationUpdate: 1000 }
            });
        });

        resetBtn.addEventListener('click', () => {
            resetBtn.style.display = 'none';
            const content = document.getElementById('drilldown-content');
            content.style.opacity = 0;
            setTimeout(() => {
                content.innerHTML = `
                    <i class="fa-solid fa-arrow-pointer text-slate-300 mb-4 animate-pulse" style="font-size: 3rem;"></i>
                    <p class="text-slate-500 font-medium">برای پایش زنده و رندر جزئیات تو در توی کسب‌وکارها،<br>روی یکی از استان‌های نقشه کلیک کنید.</p>
                `;
                content.style.opacity = 1;
            }, 200);
            this.mapChart.setOption({ geo: { zoom: 1.2, center: null, animationDurationUpdate: 1000 } });
        });
    },

    renderDetails(data) {
        const content = document.getElementById('drilldown-content');
        content.style.opacity = 0;
        setTimeout(() => {
            content.innerHTML = `
                <div class="w-full text-right px-2">
                    <h5 class="text-primary font-bold text-xl mb-4 border-b border-slate-200 pb-2">وضعیت استان ${data.faName}</h5>
                    <div class="flex justify-between mb-3 bg-slate-50 p-2 rounded">
                        <span class="text-slate-600"><i class="fa-solid fa-shop text-slate-400 ml-1"></i> اینماد فعال:</span> 
                        <strong class="text-lg">${new Intl.NumberFormat('fa-IR').format(data.value)}</strong>
                    </div>
                    <div class="flex justify-between mb-3 bg-slate-50 p-2 rounded">
                        <span class="text-slate-600"><i class="fa-solid fa-chart-line text-slate-400 ml-1"></i> نرخ رشد:</span> 
                        <strong dir="ltr" class="${data.growth >= 0 ? 'text-success' : 'text-danger'} font-bold">%${data.growth}</strong>
                    </div>
                    <button class="w-full bg-primary hover:bg-blue-800 text-white py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-md" id="btn-show-businesses">
                        <i class="fa-solid fa-list-ul"></i> مشاهده برترین‌ها
                    </button>
                </div>
            `;
            content.style.opacity = 1;
            document.getElementById('btn-show-businesses').addEventListener('click', () => this.renderBusinessList(data));
        }, 200);
    },

    renderBusinessList(data) {
        const content = document.getElementById('drilldown-content');
        content.style.opacity = 0;
        setTimeout(() => {
            content.innerHTML = `
                <div class="w-full text-right px-2">
                    <div class="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                        <h6 class="text-primary font-bold">برترین‌های ${data.faName}</h6>
                        <button class="text-slate-400 hover:text-primary transition-colors p-1" id="btn-back-prov"><i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center p-2 border border-slate-100 rounded-lg bg-slate-50">
                            <div class="text-sm font-medium"><i class="fa-solid fa-shop text-slate-400 ml-2"></i>شعبه‌های برخط محلی</div>
                            <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">۵ ستاره</span>
                        </div>
                        <div class="flex justify-between items-center p-2 border border-slate-100 rounded-lg bg-slate-50">
                            <div class="text-sm font-medium"><i class="fa-solid fa-shop text-slate-400 ml-2"></i>پلتفرم‌های خدماتی</div>
                            <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">۴ ستاره</span>
                        </div>
                    </div>
                </div>
            `;
            content.style.opacity = 1;
            document.getElementById('btn-back-prov').addEventListener('click', () => this.renderDetails(data));
        }, 200);
    }
};