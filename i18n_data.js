// i18n_data.js — Internationalization data for Taiwan Weather Extension
// Provides geographic name translations (zh-TW ↔ en) and weather/wind direction
// semantic mappings used by popup.js for multi-language rendering.

// ── County (City) Name Map ────────────────────────────────────────────────────
// Key: Chinese county name → English name
const COUNTY_NAME_EN = {
  "臺北市":  "Taipei City",
  "新北市":  "New Taipei City",
  "桃園市":  "Taoyuan City",
  "臺中市":  "Taichung City",
  "臺南市":  "Tainan City",
  "高雄市":  "Kaohsiung City",
  "基隆市":  "Keelung City",
  "新竹市":  "Hsinchu City",
  "嘉義市":  "Chiayi City",
  "新竹縣":  "Hsinchu County",
  "苗栗縣":  "Miaoli County",
  "彰化縣":  "Changhua County",
  "南投縣":  "Nantou County",
  "雲林縣":  "Yunlin County",
  "嘉義縣":  "Chiayi County",
  "屏東縣":  "Pingtung County",
  "宜蘭縣":  "Yilan County",
  "花蓮縣":  "Hualien County",
  "臺東縣":  "Taitung County",
  "澎湖縣":  "Penghu County",
  "金門縣":  "Kinmen County",
  "連江縣":  "Lienchiang County"
};

// Reverse map: English search keywords → Chinese county name
// Allows English/pinyin search to find Chinese data
const COUNTY_NAME_EN_SEARCH = {};
Object.entries(COUNTY_NAME_EN).forEach(([zh, en]) => {
  COUNTY_NAME_EN_SEARCH[en.toLowerCase()] = zh;
  // Also add simplified pinyin shorthand
  const short = en.replace(/ City| County/i, "").toLowerCase();
  if (short !== en.toLowerCase()) COUNTY_NAME_EN_SEARCH[short] = zh;
});

// ── Township / District Name Map ──────────────────────────────────────────────
// Key: "縣市名稱_鄉鎮名稱" → English district name
const TOWNSHIP_NAME_EN = {
  // 宜蘭縣
  "宜蘭縣_宜蘭市":   "Yilan City",
  "宜蘭縣_壯圍鄉":   "Zhuangwei",
  "宜蘭縣_頭城鎮":   "Toucheng",
  "宜蘭縣_礁溪鄉":   "Jiaoxi",
  "宜蘭縣_員山鄉":   "Yuanshan",
  "宜蘭縣_羅東鎮":   "Luodong",
  "宜蘭縣_三星鄉":   "Sanxing",
  "宜蘭縣_大同鄉":   "Datong",
  "宜蘭縣_五結鄉":   "Wujie",
  "宜蘭縣_冬山鄉":   "Dongshan",
  "宜蘭縣_蘇澳鎮":   "Su'ao",
  "宜蘭縣_南澳鄉":   "Nan'ao",
  // 桃園市
  "桃園市_中壢區":   "Zhongli Dist.",
  "桃園市_平鎮區":   "Pingzhen Dist.",
  "桃園市_龍潭區":   "Longtan Dist.",
  "桃園市_楊梅區":   "Yangmei Dist.",
  "桃園市_新屋區":   "Xinwu Dist.",
  "桃園市_觀音區":   "Guanyin Dist.",
  "桃園市_桃園區":   "Taoyuan Dist.",
  "桃園市_龜山區":   "Guishan Dist.",
  "桃園市_八德區":   "Bade Dist.",
  "桃園市_大溪區":   "Daxi Dist.",
  "桃園市_復興區":   "Fuxing Dist.",
  "桃園市_大園區":   "Dayuan Dist.",
  "桃園市_蘆竹區":   "Luzhu Dist.",
  // 新竹縣
  "新竹縣_寶山鄉":   "Baoshan",
  "新竹縣_竹北市":   "Zhubei City",
  "新竹縣_湖口鄉":   "Hukou",
  "新竹縣_新豐鄉":   "Xinfeng",
  "新竹縣_新埔鎮":   "Xinpu",
  "新竹縣_關西鎮":   "Guanxi",
  "新竹縣_芎林鄉":   "Qionglin",
  "新竹縣_竹東鎮":   "Zhudong",
  "新竹縣_五峰鄉":   "Wufeng",
  "新竹縣_橫山鄉":   "Hengshan",
  "新竹縣_尖石鄉":   "Jianshi",
  "新竹縣_北埔鄉":   "Beipu",
  "新竹縣_峨眉鄉":   "Emei",
  // 苗栗縣
  "苗栗縣_竹南鎮":   "Zhunan",
  "苗栗縣_頭份市":   "Toufen City",
  "苗栗縣_三灣鄉":   "Sanwan",
  "苗栗縣_南庄鄉":   "Nanzhuang",
  "苗栗縣_獅潭鄉":   "Shitan",
  "苗栗縣_後龍鎮":   "Houlong",
  "苗栗縣_通霄鎮":   "Tongxiao",
  "苗栗縣_苑裡鎮":   "Yuanli",
  "苗栗縣_苗栗市":   "Miaoli City",
  "苗栗縣_造橋鄉":   "Zaoqiao",
  "苗栗縣_頭屋鄉":   "Touwu",
  "苗栗縣_公館鄉":   "Gongguan",
  "苗栗縣_大湖鄉":   "Dahu",
  "苗栗縣_泰安鄉":   "Tai'an",
  "苗栗縣_銅鑼鄉":   "Tongluo",
  "苗栗縣_三義鄉":   "Sanyi",
  "苗栗縣_西湖鄉":   "Xihu",
  "苗栗縣_卓蘭鎮":   "Zhuolan",
  // 彰化縣
  "彰化縣_彰化市":   "Changhua City",
  "彰化縣_芬園鄉":   "Fenyuan",
  "彰化縣_花壇鄉":   "Huatan",
  "彰化縣_秀水鄉":   "Xiushui",
  "彰化縣_鹿港鎮":   "Lukang",
  "彰化縣_福興鄉":   "Fuxing",
  "彰化縣_線西鄉":   "Xianxi",
  "彰化縣_和美鎮":   "Hemei",
  "彰化縣_伸港鄉":   "Shengang",
  "彰化縣_員林市":   "Yuanlin City",
  "彰化縣_社頭鄉":   "Shetou",
  "彰化縣_永靖鄉":   "Yongjing",
  "彰化縣_埔心鄉":   "Puxin",
  "彰化縣_溪湖鎮":   "Xihu",
  "彰化縣_大村鄉":   "Dacun",
  "彰化縣_埔鹽鄉":   "Puyan",
  "彰化縣_田中鎮":   "Tianzhong",
  "彰化縣_北斗鎮":   "Beidou",
  "彰化縣_田尾鄉":   "Tianwei",
  "彰化縣_埤頭鄉":   "Pitou",
  "彰化縣_溪州鄉":   "Xizhou",
  "彰化縣_竹塘鄉":   "Zhutang",
  "彰化縣_二林鎮":   "Erlin",
  "彰化縣_大城鄉":   "Dacheng",
  "彰化縣_芳苑鄉":   "Fangyuan",
  "彰化縣_二水鄉":   "Ershui",
  // 南投縣
  "南投縣_南投市":   "Nantou City",
  "南投縣_中寮鄉":   "Zhongliao",
  "南投縣_草屯鎮":   "Caotun",
  "南投縣_國姓鄉":   "Guoxing",
  "南投縣_埔里鎮":   "Puli",
  "南投縣_仁愛鄉":   "Ren'ai",
  "南投縣_名間鄉":   "Mingjian",
  "南投縣_集集鎮":   "Jiji",
  "南投縣_水里鄉":   "Shuili",
  "南投縣_魚池鄉":   "Yuchi",
  "南投縣_信義鄉":   "Xinyi",
  "南投縣_竹山鎮":   "Zhushan",
  "南投縣_鹿谷鄉":   "Lugu",
  // 雲林縣
  "雲林縣_斗南鎮":   "Dounan",
  "雲林縣_大埤鄉":   "Dapi",
  "雲林縣_虎尾鎮":   "Huwei",
  "雲林縣_土庫鎮":   "Tuku",
  "雲林縣_褒忠鄉":   "Baozhong",
  "雲林縣_東勢鄉":   "Dongshi",
  "雲林縣_臺西鄉":   "Taixi",
  "雲林縣_崙背鄉":   "Lunbei",
  "雲林縣_麥寮鄉":   "Mailiao",
  "雲林縣_斗六市":   "Douliu City",
  "雲林縣_林內鄉":   "Linnei",
  "雲林縣_古坑鄉":   "Gukeng",
  "雲林縣_莿桐鄉":   "Citong",
  "雲林縣_西螺鎮":   "Xiluo",
  "雲林縣_二崙鄉":   "Erlun",
  "雲林縣_北港鎮":   "Beigang",
  "雲林縣_水林鄉":   "Shuilin",
  "雲林縣_口湖鄉":   "Kouhu",
  "雲林縣_四湖鄉":   "Sihu",
  "雲林縣_元長鄉":   "Yuanchang",
  // 嘉義縣
  "嘉義縣_番路鄉":   "Fanlu",
  "嘉義縣_梅山鄉":   "Meishan",
  "嘉義縣_竹崎鄉":   "Zhuqi",
  "嘉義縣_阿里山鄉": "Alishan",
  "嘉義縣_中埔鄉":   "Zhongpu",
  "嘉義縣_大埔鄉":   "Dapu",
  "嘉義縣_水上鄉":   "Shuishang",
  "嘉義縣_鹿草鄉":   "Lucao",
  "嘉義縣_太保市":   "Taibao City",
  "嘉義縣_朴子市":   "Puzi City",
  "嘉義縣_東石鄉":   "Dongshi",
  "嘉義縣_六腳鄉":   "Liujiao",
  "嘉義縣_新港鄉":   "Xingang",
  "嘉義縣_民雄鄉":   "Minxiong",
  "嘉義縣_大林鎮":   "Dalin",
  "嘉義縣_溪口鄉":   "Xikou",
  "嘉義縣_義竹鄉":   "Yizhu",
  "嘉義縣_布袋鎮":   "Budai",
  // 屏東縣
  "屏東縣_屏東市":   "Pingtung City",
  "屏東縣_三地門鄉": "Sandimen",
  "屏東縣_霧臺鄉":   "Wutai",
  "屏東縣_瑪家鄉":   "Majia",
  "屏東縣_九如鄉":   "Jiuru",
  "屏東縣_里港鄉":   "Ligang",
  "屏東縣_高樹鄉":   "Gaoshu",
  "屏東縣_鹽埔鄉":   "Yanpu",
  "屏東縣_長治鄉":   "Changzhi",
  "屏東縣_麟洛鄉":   "Linluo",
  "屏東縣_竹田鄉":   "Zhutian",
  "屏東縣_內埔鄉":   "Neipu",
  "屏東縣_萬丹鄉":   "Wandan",
  "屏東縣_潮州鎮":   "Chaozhou",
  "屏東縣_泰武鄉":   "Taiwu",
  "屏東縣_來義鄉":   "Laiyi",
  "屏東縣_萬巒鄉":   "Wanluan",
  "屏東縣_崁頂鄉":   "Kanding",
  "屏東縣_新埤鄉":   "Xinpi",
  "屏東縣_南州鄉":   "Nanzhou",
  "屏東縣_林邊鄉":   "Linbian",
  "屏東縣_東港鎮":   "Donggang",
  "屏東縣_琉球鄉":   "Liuqiu",
  "屏東縣_佳冬鄉":   "Jiadong",
  "屏東縣_新園鄉":   "Xinyuan",
  "屏東縣_枋寮鄉":   "Fangliao",
  "屏東縣_枋山鄉":   "Fangshan",
  "屏東縣_春日鄉":   "Chunri",
  "屏東縣_獅子鄉":   "Shizi",
  "屏東縣_車城鄉":   "Checheng",
  "屏東縣_牡丹鄉":   "Mudan",
  "屏東縣_恆春鎮":   "Hengchun",
  "屏東縣_滿州鄉":   "Manzhou",
  // 臺東縣
  "臺東縣_臺東市":   "Taitung City",
  "臺東縣_綠島鄉":   "Green Island",
  "臺東縣_蘭嶼鄉":   "Orchid Island",
  "臺東縣_延平鄉":   "Yanping",
  "臺東縣_卑南鄉":   "Beinan",
  "臺東縣_鹿野鄉":   "Luye",
  "臺東縣_關山鎮":   "Guanshan",
  "臺東縣_海端鄉":   "Haiduan",
  "臺東縣_池上鄉":   "Chishang",
  "臺東縣_東河鄉":   "Donghe",
  "臺東縣_成功鎮":   "Chenggong",
  "臺東縣_長濱鄉":   "Changbin",
  "臺東縣_太麻里鄉": "Taimali",
  "臺東縣_金峰鄉":   "Jinfeng",
  "臺東縣_大武鄉":   "Dawu",
  "臺東縣_達仁鄉":   "Daren",
  // 花蓮縣
  "花蓮縣_花蓮市":   "Hualien City",
  "花蓮縣_新城鄉":   "Xincheng",
  "花蓮縣_秀林鄉":   "Xiulin",
  "花蓮縣_吉安鄉":   "Ji'an",
  "花蓮縣_壽豐鄉":   "Shoufeng",
  "花蓮縣_鳳林鎮":   "Fenglin",
  "花蓮縣_光復鄉":   "Guangfu",
  "花蓮縣_豐濱鄉":   "Fengbin",
  "花蓮縣_瑞穗鄉":   "Ruisui",
  "花蓮縣_萬榮鄉":   "Wanrong",
  "花蓮縣_玉里鎮":   "Yuli",
  "花蓮縣_卓溪鄉":   "Zhuoxi",
  "花蓮縣_富里鄉":   "Fuli",
  // 澎湖縣
  "澎湖縣_馬公市":   "Magong City",
  "澎湖縣_西嶼鄉":   "Xiyu",
  "澎湖縣_望安鄉":   "Wang'an",
  "澎湖縣_七美鄉":   "Qimei",
  "澎湖縣_白沙鄉":   "Baisha",
  "澎湖縣_湖西鄉":   "Huxi",
  // 基隆市
  "基隆市_仁愛區":   "Ren'ai Dist.",
  "基隆市_信義區":   "Xinyi Dist.",
  "基隆市_中正區":   "Zhongzheng Dist.",
  "基隆市_中山區":   "Zhongshan Dist.",
  "基隆市_安樂區":   "Anle Dist.",
  "基隆市_暖暖區":   "Nuannuan Dist.",
  "基隆市_七堵區":   "Qidu Dist.",
  // 新竹市
  "新竹市_東區":     "East Dist.",
  "新竹市_北區":     "North Dist.",
  "新竹市_香山區":   "Xiangshan Dist.",
  // 嘉義市
  "嘉義市_西區":     "West Dist.",
  "嘉義市_東區":     "East Dist.",
  // 臺北市
  "臺北市_中正區":   "Zhongzheng Dist.",
  "臺北市_大同區":   "Datong Dist.",
  "臺北市_中山區":   "Zhongshan Dist.",
  "臺北市_松山區":   "Songshan Dist.",
  "臺北市_大安區":   "Da'an Dist.",
  "臺北市_萬華區":   "Wanhua Dist.",
  "臺北市_信義區":   "Xinyi Dist.",
  "臺北市_士林區":   "Shilin Dist.",
  "臺北市_北投區":   "Beitou Dist.",
  "臺北市_內湖區":   "Neihu Dist.",
  "臺北市_南港區":   "Nangang Dist.",
  "臺北市_文山區":   "Wenshan Dist.",
  // 高雄市
  "高雄市_新興區":   "Xinxing Dist.",
  "高雄市_前金區":   "Qianjin Dist.",
  "高雄市_苓雅區":   "Lingya Dist.",
  "高雄市_鹽埕區":   "Yancheng Dist.",
  "高雄市_鼓山區":   "Gushan Dist.",
  "高雄市_旗津區":   "Qijin Dist.",
  "高雄市_前鎮區":   "Qianzhen Dist.",
  "高雄市_三民區":   "Sanmin Dist.",
  "高雄市_楠梓區":   "Nanzi Dist.",
  "高雄市_小港區":   "Siaogang Dist.",
  "高雄市_左營區":   "Zuoying Dist.",
  "高雄市_仁武區":   "Renwu Dist.",
  "高雄市_大社區":   "Dashe Dist.",
  "高雄市_東沙群島": "Dongsha Islands",
  "高雄市_南沙群島": "Nansha Islands",
  "高雄市_岡山區":   "Gangshan Dist.",
  "高雄市_路竹區":   "Luzhu Dist.",
  "高雄市_阿蓮區":   "Alian Dist.",
  "高雄市_田寮區":   "Tianliao Dist.",
  "高雄市_燕巢區":   "Yanchao Dist.",
  "高雄市_橋頭區":   "Qiaotou Dist.",
  "高雄市_梓官區":   "Ziguan Dist.",
  "高雄市_彌陀區":   "Mituo Dist.",
  "高雄市_永安區":   "Yong'an Dist.",
  "高雄市_湖內區":   "Hunei Dist.",
  "高雄市_鳳山區":   "Fongshan Dist.",
  "高雄市_大寮區":   "Daliao Dist.",
  "高雄市_林園區":   "Linyuan Dist.",
  "高雄市_鳥松區":   "Niaosong Dist.",
  "高雄市_大樹區":   "Dashu Dist.",
  "高雄市_旗山區":   "Qishan Dist.",
  "高雄市_美濃區":   "Meinong Dist.",
  "高雄市_六龜區":   "Liugui Dist.",
  "高雄市_內門區":   "Neimen Dist.",
  "高雄市_杉林區":   "Shanlin Dist.",
  "高雄市_甲仙區":   "Jiaxian Dist.",
  "高雄市_桃源區":   "Taoyuan Dist.",
  "高雄市_那瑪夏區": "Namaxia Dist.",
  "高雄市_茂林區":   "Maolin Dist.",
  "高雄市_茄萣區":   "Qieding Dist.",
  // 新北市
  "新北市_萬里區":   "Wanli Dist.",
  "新北市_金山區":   "Jinshan Dist.",
  "新北市_板橋區":   "Banqiao Dist.",
  "新北市_汐止區":   "Xizhi Dist.",
  "新北市_深坑區":   "Shenkeng Dist.",
  "新北市_石碇區":   "Shiding Dist.",
  "新北市_瑞芳區":   "Ruifang Dist.",
  "新北市_平溪區":   "Pingxi Dist.",
  "新北市_雙溪區":   "Shuangxi Dist.",
  "新北市_貢寮區":   "Gongliao Dist.",
  "新北市_新店區":   "Xindian Dist.",
  "新北市_坪林區":   "Pinglin Dist.",
  "新北市_烏來區":   "Wulai Dist.",
  "新北市_永和區":   "Yonghe Dist.",
  "新北市_中和區":   "Zhonghe Dist.",
  "新北市_土城區":   "Tucheng Dist.",
  "新北市_三峽區":   "Sansia Dist.",
  "新北市_樹林區":   "Shulin Dist.",
  "新北市_鶯歌區":   "Yingge Dist.",
  "新北市_三重區":   "Sanchong Dist.",
  "新北市_新莊區":   "Xinzhuang Dist.",
  "新北市_泰山區":   "Taishan Dist.",
  "新北市_林口區":   "Linkou Dist.",
  "新北市_蘆洲區":   "Luzhou Dist.",
  "新北市_五股區":   "Wugu Dist.",
  "新北市_八里區":   "Bali Dist.",
  "新北市_淡水區":   "Danshui Dist.",
  "新北市_三芝區":   "Sanzhi Dist.",
  "新北市_石門區":   "Shimen Dist.",
  // 臺中市
  "臺中市_中區":     "Central Dist.",
  "臺中市_東區":     "East Dist.",
  "臺中市_南區":     "South Dist.",
  "臺中市_西區":     "West Dist.",
  "臺中市_北區":     "North Dist.",
  "臺中市_北屯區":   "Beitun Dist.",
  "臺中市_西屯區":   "Xitun Dist.",
  "臺中市_南屯區":   "Nantun Dist.",
  "臺中市_太平區":   "Taiping Dist.",
  "臺中市_大里區":   "Dali Dist.",
  "臺中市_霧峰區":   "Wufeng Dist.",
  "臺中市_烏日區":   "Wuri Dist.",
  "臺中市_豐原區":   "Fengyuan Dist.",
  "臺中市_后里區":   "Houli Dist.",
  "臺中市_石岡區":   "Shigang Dist.",
  "臺中市_東勢區":   "Dongshi Dist.",
  "臺中市_和平區":   "Heping Dist.",
  "臺中市_新社區":   "Xinshe Dist.",
  "臺中市_潭子區":   "Tanzi Dist.",
  "臺中市_大雅區":   "Daya Dist.",
  "臺中市_神岡區":   "Shengang Dist.",
  "臺中市_大肚區":   "Dadu Dist.",
  "臺中市_沙鹿區":   "Shalu Dist.",
  "臺中市_龍井區":   "Longjing Dist.",
  "臺中市_梧棲區":   "Wuqi Dist.",
  "臺中市_清水區":   "Qingshui Dist.",
  "臺中市_大甲區":   "Dajia Dist.",
  "臺中市_外埔區":   "Waipu Dist.",
  "臺中市_大安區":   "Da'an Dist.",
  // 臺南市
  "臺南市_中西區":   "Zhongxi Dist.",
  "臺南市_東區":     "East Dist.",
  "臺南市_南區":     "South Dist.",
  "臺南市_北區":     "North Dist.",
  "臺南市_安平區":   "Anping Dist.",
  "臺南市_安南區":   "Annan Dist.",
  "臺南市_永康區":   "Yongkang Dist.",
  "臺南市_歸仁區":   "Guiren Dist.",
  "臺南市_新化區":   "Xinhua Dist.",
  "臺南市_左鎮區":   "Zuozhen Dist.",
  "臺南市_玉井區":   "Yujing Dist.",
  "臺南市_楠西區":   "Nanxi Dist.",
  "臺南市_南化區":   "Nanhua Dist.",
  "臺南市_仁德區":   "Rende Dist.",
  "臺南市_關廟區":   "Guanmiao Dist.",
  "臺南市_龍崎區":   "Longqi Dist.",
  "臺南市_官田區":   "Guantian Dist.",
  "臺南市_麻豆區":   "Madou Dist.",
  "臺南市_佳里區":   "Jiali Dist.",
  "臺南市_西港區":   "Xigang Dist.",
  "臺南市_七股區":   "Qigu Dist.",
  "臺南市_將軍區":   "Jiangjun Dist.",
  "臺南市_學甲區":   "Xuejia Dist.",
  "臺南市_北門區":   "Beimen Dist.",
  "臺南市_新營區":   "Xinying Dist.",
  "臺南市_後壁區":   "Houbi Dist.",
  "臺南市_白河區":   "Baihe Dist.",
  "臺南市_東山區":   "Dongshan Dist.",
  "臺南市_六甲區":   "Liujia Dist.",
  "臺南市_下營區":   "Xiaying Dist.",
  "臺南市_柳營區":   "Liuying Dist.",
  "臺南市_鹽水區":   "Yanshui Dist.",
  "臺南市_善化區":   "Shanhua Dist.",
  "臺南市_新市區":   "Xinshi Dist.",
  "臺南市_大內區":   "Danei Dist.",
  "臺南市_山上區":   "Shanshang Dist.",
  "臺南市_安定區":   "Anding Dist.",
  // 連江縣
  "連江縣_南竿鄉":   "Nangan",
  "連江縣_北竿鄉":   "Beigan",
  "連江縣_莒光鄉":   "Juguang",
  "連江縣_東引鄉":   "Dongyin",
  // 金門縣
  "金門縣_金沙鎮":   "Jinsha",
  "金門縣_金湖鎮":   "Jinhu",
  "金門縣_金寧鄉":   "Jinning",
  "金門縣_金城鎮":   "Jincheng",
  "金門縣_烈嶼鄉":   "Lieyu",
  "金門縣_烏坵鄉":   "Wuqiu"
};

// ── Wind Direction Translation Map ───────────────────────────────────────────
// Maps CWA Chinese wind direction strings to English equivalents
const WIND_DIR_TRANSLATION = {
  "偏北風":   "Northerly Wind",
  "偏東北風": "NNE Wind",
  "東北風":   "NE Wind",
  "偏東風":   "Easterly Wind",
  "東南風":   "SE Wind",
  "偏東南風": "ESE Wind",
  "偏南風":   "Southerly Wind",
  "偏西南風": "WSW Wind",
  "西南風":   "SW Wind",
  "偏西風":   "Westerly Wind",
  "西北風":   "NW Wind",
  "偏西北風": "WNW Wind",
  "北風":     "North Wind",
  "南風":     "South Wind",
  "東風":     "East Wind",
  "西風":     "West Wind",
  "無風":     "Calm",
  "微風":     "Light Breeze",
  "靜風":     "Calm",
  "--":        "--"
};

// ── Weather Condition (Wx) Translation ───────────────────────────────────────
// Maps CWA Chinese Wx strings to English display strings (7 semantic categories)
// Uses keyword-based detection, same logic as getWeatherIconKey()
function translateWx(wxText, lang) {
  if (!wxText || wxText === "--" || lang !== "en") return wxText;
  if (wxText.includes("晴") && !wxText.includes("雨") && !wxText.includes("雲")) return "Sunny";
  if (wxText.includes("晴") && wxText.includes("雲")) return "Partly Cloudy";
  if (wxText.includes("多雲") && !wxText.includes("雨")) return "Cloudy";
  if (wxText.includes("陰") && !wxText.includes("雨")) return "Overcast";
  if (wxText.includes("雷")) return "Thunderstorm";
  if (wxText.includes("雨") || wxText.includes("落水") || wxText.includes("暴")) return "Rainy";
  if (wxText.includes("雪")) return "Snowy";
  if (wxText.includes("風") || wxText.includes("霧") || wxText.includes("霾") || wxText.includes("颱") || wxText.includes("颶")) return "Windy";
  return wxText; // fallback: return as-is
}

// ── Wind Direction Translation Helper ────────────────────────────────────────
function translateWindDir(windDir, lang) {
  if (!windDir || windDir === "--" || lang !== "en") return windDir;
  // Try exact match
  if (WIND_DIR_TRANSLATION[windDir]) return WIND_DIR_TRANSLATION[windDir];
  // Try prefix match for compound directions
  for (const [zh, en] of Object.entries(WIND_DIR_TRANSLATION)) {
    if (windDir.startsWith(zh)) return en;
  }
  return windDir;
}

// ── Geographic Name Helpers ────────────────────────────────────────────────
function getCountyNameEn(countyZh) {
  return COUNTY_NAME_EN[countyZh] || countyZh;
}

function getTownshipNameEn(countyZh, townshipZh) {
  return TOWNSHIP_NAME_EN[`${countyZh}_${townshipZh}`] || townshipZh;
}

// Format location display string based on language
function formatLocationDisplay(countyZh, townshipZh, lang) {
  if (lang === "en") {
    const countyEn   = getCountyNameEn(countyZh);
    const townshipEn = getTownshipNameEn(countyZh, townshipZh);
    return `${countyEn} ${townshipEn}`;
  }
  return `${countyZh} ${townshipZh}`;
}

// Format township chip label (short form)
function formatChipLabel(countyZh, townshipZh, lang) {
  if (lang === "en") {
    return getTownshipNameEn(countyZh, townshipZh);
  }
  return townshipZh;
}

// ── English Search Index ──────────────────────────────────────────────────────
// Build an array of { county, township, countyEn, townshipEn } for English search
const GEO_SEARCH_INDEX = [];
(function buildSearchIndex() {
  Object.entries(TOWNSHIP_NAME_EN).forEach(([key, townEn]) => {
    const [countyZh, townZh] = key.split("_");
    const countyEn = COUNTY_NAME_EN[countyZh] || countyZh;
    GEO_SEARCH_INDEX.push({
      county: countyZh,
      township: townZh,
      countyEn,
      townshipEn: townEn
    });
  });
})();

// Search both Chinese and English fields
function searchGeoData(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results = [];
  const seen = new Set();

  // Try Chinese search first (using CITY_COUNTY_DATA defined in city_county_data.js)
  if (typeof CITY_COUNTY_DATA !== "undefined") {
    CITY_COUNTY_DATA.forEach(city => {
      const countyMatch = city.cityName.includes(q);
      city.townships.forEach(town => {
        if (countyMatch || town.includes(q)) {
          const key = `${city.cityName}_${town}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ county: city.cityName, township: town });
          }
        }
      });
    });
  }

  // Also try English search
  GEO_SEARCH_INDEX.forEach(entry => {
    const key = `${entry.county}_${entry.township}`;
    if (!seen.has(key)) {
      const countyEnLower   = entry.countyEn.toLowerCase();
      const townshipEnLower = entry.townshipEn.toLowerCase();
      if (countyEnLower.includes(q) || townshipEnLower.includes(q)) {
        seen.add(key);
        results.push({ county: entry.county, township: entry.township });
      }
    }
  });

  return results;
}
