const { iterMessages } = require("telegram/client/messages");

function prepareTitle(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】 или《 》 или 「 」
    // const match = title.match(/[\[【《「]([^\]】》」]+)[\]】》」]/); 
    const match = title.match(/[\[【《「]([^\]】》」]+)[\]】》」]/);
    return match ? match[1].trim() : '';
}


function prepareTitle2(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】 или《 》 или 「 」
    // const match = title.match(/[\---]([^\---]+)[\---]/); 
    const match = title.match(/🫸([^]+?)🫷/); 
    return match ? match[1].trim() : '';
}

function prepareTitle3(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】 или《 》 или 「 」
    // const match = title.match(/[\---]([^\---]+)[\---]/); 
    const match = title.match(/---([^]+?)---/);
    // const match = title.match(/[\<]([^\>]+)[\>]/); 
    return match ? match[1].trim() || match[args[1]].trim()  : '';
}

function foundBrand(title, ...args) {
    // Список брендов с вариантами написания
    const brands = [
        //       【】
        { canonical: 'Gucci', variants: ['Gucci', 'Gucci Italy', 'GUCCI', 'gucci', 'Gucc*', '古驰', '古奇', '古驰巴黎', '古～', 'G 🔍', '-GUCCl', 'GUCCl', 'G 家', '古奇', '代购级', '男士凉鞋' ] },
        { canonical: 'Louis Vuitton', variants: ['Louis Vuitton','路易威登', 'LV路', '路易威登LV', '登LV', 'Lv～', 'L.v', 'LVLV', 'LouisVuitton', 'lv-',  'LV男士拖鞋', 'LOUIS VUITTON', 'louis vuitton', 'OUIS', 'LOUI VUITTO', 'LOUIS UITTO', 'OUIS UITTO', 'OUIS UITTO', 'OUIS UITTO', 'OUIS', 'UITTO',   'Louis V ', 'LOUI VUITTO', 'LOUI', 'VUITTO', 'L家', 'L家巴黎', 'L经巴黎', '【LV】', '【路易威登】', 'LV🔥', 'LV🔥🔥🔥' ] },
        // { canonical: 'D&G',variants: ['D&G', 'Dolce & Gabbana', 'Dolce Gabbana', 'DGdg', 'DG', 'dg',     'G', 'G logo',]},
        { canonical: 'Dior', variants: ['Dior', 'Christian Dior', 'ChristianDior', 'DIOR', 'dior', 'dio', 'Dio', '迪奥', '迪奥巴黎', '迪奥～', '迪～'] },
        { canonical: 'Fendi', variants: ['Fendi', 'Fendi Roma', 'FendiRoma', 'FENDI', 'fendi', 'FEND', 'Fedi', 'Fe*di', '芬迪', '芬迪巴黎', '芬～'] },
        { canonical: 'Tod’s', variants: ['Tod’s', 'Tods', 'Tod s', 'Tod', 'TODS', 'tods'] },
        { canonical: 'Prada', variants: ['Prada', 'Prada Milano', 'PradaMilan', 'PRADA', 'pRADA', 'P R A D A', 'prad', 'pRAD', '普拉达', '普拉达米兰', '普～'] },
        { canonical: 'Hermes', variants: ['Hermes', 'Hermès', 'Hermes Paris', 'HERMES', 'HermesParis', 'HERME', 'HERMESTPR', 'HERMES HERMES', 'HER MES', 'HERME Bouncing', 'Bouncing', 'HERME Bouncing', 'Bouncing', '爱马仕', '爱马仕巴黎', '爱～', 'H高', 'H 🔍', '【H家 爱马仕】', '【爱马仕】' ]  },
        { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani', 'VALENTINO', 'valentino', '华伦天奴', '华伦天奴巴黎', '华～'] },
        { canonical: 'Trillionaire', variants: ['Trillionaire', 'TRILLIONAIRE', 'Trillionaire', 'trillionaire', '3illionaire', '特里利安尼']},
        { canonical: 'Loro Piana', variants: ['Loro Piana', 'LORO PIANA', 'LoroPiana', 'LORO ', 'LORO', 'loro', '罗洛·皮亚纳']},
        { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci', 'Balenciaga Paris', 'BALENCIAGA', 'balenciaga', 'BALENCICGA', '巴黎世家', 'Tra Sneaker'] },
        { canonical: 'Dsquared2',variants: ['Dsquared2', 'Dsquared', 'Dsquared2', 'DSQUARED2', 'dsquared2',   'D2']},
        { canonical: 'Moncler', variants: ['Moncler', 'MONCLER', 'Moncler', 'moncler',     'moncler', 'Moncle',   '蒙克莱', '蒙克莱巴黎', '蒙～', 'monc', '毛里订做', '蒙口']},
        { canonical: 'Ferragamo',variants: ['Ferragamo', 'Salvatore Ferragamo', 'Ferraga', 'F Gancini', '菲拉格慕', '牛里', '牛里奥']},
        { canonical: 'Givenchy', variants: ['Givenchy', 'GIVENCHY', 'Givenchy Paris', 'G I V E N C H Y', 'GIVENCHY', 'givenchy', '纪梵希', '纪梵希巴黎', '纪～'] },
        { canonical: 'Tom Ford',variants: ['Tom Ford', 'TOM FORD', 'Tom Ford', 'tom ford', 'TOMF ORD', '汤姆·福特']},
        { canonical: 'Versace', variants: ['Versace', 'Gianni Versace', 'Versace Italy', 'VERACE', 'versace', '范思哲', '范思哲巴黎', '范～', '【范思哲】'] },
        { canonical: 'Armani', variants: ['Armani', 'Giorgio Armani', 'GiorgioArmani', 'ARMANI', 'armani', 'Emporio Armani', 'EMPORIO ARMANI', 'Emporio ar', 'Emporio Ar', '-ARMARNI', '乔治·阿玛尼', '乔治·阿玛尼巴黎', '乔治～', '阿玛尼', '阿玛～'] },
        { canonical: 'Amiri', variants: ['Amiri', 'Amiri LA', 'AmiriLosAngeles', 'AMIRI', 'amiri', '阿米里'] },
        { canonical: 'Boss', variants: ['Boss', 'BOSS', 'Hugo Boss', 'HugoBoss', 'BOOS', 'boss', '博斯', '博斯巴黎', '博～', 'ＢＯＳＳ', 'BO～'] },
        { canonical: 'Off-White', variants: ['Off-White', 'Off White', 'OffWhite', 'OFF WHITE', 'off white',     'OFF', 'off'] },
        { canonical: 'Chanel', variants: ['Chanel', 'CHANEL', 'Chanel Paris', 'Chanel', 'chanel', '香奈儿', '香奈儿巴黎', '香～', '香奈儿', '香奈儿巴黎', '香～', 'Chnel']},
        { canonical: 'Kenzo', variants: ['Kenzo', 'KENZO', 'Kenzo Paris', 'KENZO', 'kenzo', '高田贤三', '高田贤三巴黎', '高～']},
        { canonical: 'Bally', variants: ['Bally', 'BALLY', 'Bally', 'bally', '巴利', '巴利巴黎', '巴～']},
        { canonical: 'Balmain', variants: ['Balmain', 'BALMAIN', 'Balmain', 'balmain', '巴尔曼', '巴尔～']},
        { canonical: 'Nike', variants: ['Nike', 'NIKE', 'Nike', 'nike', 'Nike Dunk Low', 'Nike Dunk', 'Nike Dunk SB', 'Nike SB', 'Nike SB Dunk', 'Nike SB Dunk Low', 'Nike SB Dunk High', 'Nike SB Dunk Pro', 'Nike SB Dunk Pro Low', 'Nike SB Dunk Pro High', '耐克']},
        { canonical: 'Hogan', variants: ['HOGAN', 'Hogan', 'hogan', '霍根']},
        { canonical: 'Y-3', variants: ['Y-3', 'Y3']},
        { canonical: 'COACH', variants: ['COACH', 'Coach', '蔻驰', '蒄～']},
        { canonical: 'MIUMIU', variants: ['MIUMIU', 'Miu Miu', 'Miu Miu', 'MIUMIU', 'miu miu', '原单品质•独家首发', '缪缪', '缪缪巴黎', '缪～']},
        { canonical: 'Santoni', variants: ['Santoni', 'Santoni Shoes', 'SANTONI', 'santoni'] },
        { canonical: 'Olympia', variants: ['Olympia', 'OLYMPIA', 'Olympia', 'olympia',     '奥林匹亚']},
        { canonical: 'Burberry', variants: ['Burberry', 'Burberry London', 'Burberry London', 'BURBERRY', 'BURBERR', 'Vintage', 'burberry',  '路易威',     '博柏利', '博柏利巴黎', '博～', '博柏利', '巴宝莉', '巴宝莉巴黎', '巴～', '宝～', 'B家', '跑量'] },
        { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani', 'VALENTINO', 'valentino',     'VLTN', '华伦天奴', '华伦天奴巴黎', '华～', '伦～']},
        { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci', 'Balenciaga Paris', 'BALENCIAGA', 'balenciaga', 'BALENCICGA', '巴黎世家']},
        { canonical: 'Thom Browne', variants: ['Thom Browne', 'Thom Browne', 'Thom Browne', 'THOM BROWNE', 'TH0M BR0WNE', 'thom browne', 'THOM ', '汤姆·布朗']},
        { canonical: 'Stefano Ricci', variants: ['Stefano Ricci', 'Stefano Ricci', 'Stefano Ricci', 'STEFANO RICCI', 'stefano ricci', 'STEFANO ', '斯蒂芬诺·里奇']},
        { canonical: 'Philipp Plein', variants: ['Philipp Plein', 'Plein', 'PhilippPlein', 'P-P',  'pHILIpp pLEIN', '菲利普·普莱恩', '菲利普普莱', 'PP～', 'PP'] },
        { canonical: 'Bottega Veneta', variants: ['Bottega Veneta', 'Bottega', 'BottegaVeneta', 'bottega veneta', 'BOTTEGA VENETA', '葆蝶家', 'BV男士拖鞋', '【BV】', 'B V' ] },
        { canonical: 'Dolce & Gabbana', variants: ['Dolce & Gabbana', 'Dolce Gabbana', 'D&G', 'DolceGabbana', 'Dolce&Gabbana', 'DGdg', '杜嘉班纳', 'DG杜嘉班纳', 'DG～杜嘉班纳', 'DOLC GDBNA ', 'DG', '杜嘉班纳&DG', 'DG杜嘉班纳', 'gabbana'] },
        { canonical: 'Village Garavani', variants: ['Village Garavani', 'Village Garavani', 'Village Garavani', 'VILLAGE GARAVANI', 'village garavani', 'VILLAGE ', '维尔村·加拉瓦尼']},
        { canonical: 'Ermenegildo Zegna', variants: ['Ermenegildo Zegna', 'Zegna', 'ErmenegildoZegna', 'EZegna', 'ZegnaZegna', 'ZEGNA', 'zegna', '杰尼亚'] },
        { canonical: 'Brunello Cucinelli', variants: ['Brunello Cucinelli', 'Cucinelli', 'BrunelloCucinelli', 'BRUNELLO CUCINELLI', 'brunello cucinelli', 'BRUNELLO CUCINELLI', 'BrunelloCucinelli', 'BC', '布兰诺', '布兰诺巴黎', '布～', '-高端品质  原单🔍🔍🔍'] },
        { canonical: 'Alexander McQueen', variants: ['Alexander McQueen', 'McQueen', 'AlexanderMcQueen', 'MQUEEN', '亚历山大·麦昆', '亚历山大·麦昆巴黎', '亚～'] },
        { canonical: 'Giuseppe Zanotti', variants: [ 'Giuseppe Zanotti',]},
        { canonical: 'Berluti', variants: ['Berluti', 'Berluti', 'Berluti', 'BERLUTI', 'berluti', 'Berlut', '伯尔鲁帝', '伯尔鲁帝巴黎', '伯～', '布鲁提', '布鲁～']},
        { canonical: 'Christian Louboutin', variants: ['Christian Louboutin', 'Louboutin', 'ChristianLouboutin', 'CHRISTIAN LOUBOUTIN', 'christian louboutin', 'CHRISTIAN ', 'CL家', 'CL经', 'CL家巴黎', 'CL经巴黎', 'CL家', 'CL经', 'CL～高端男士红底鞋', '克里斯提·鲁布托', '克里斯提·鲁布托巴黎', '克～',]},
        { canonical: 'Lacoste', variants: ['Lacoste', 'LACOSTE', 'LACOSTE', 'lacoste', '鳄鱼', '鳄鱼巴黎', '鳄～',]},
        { canonical: 'Karl Lagerfeld', variants: ['Karl Lagerfeld', 'Karl Lagerfeld', 'Karl Lagerfeld', 'KARL LAGERFELD', 'karl lagerfeld', 'KARL ', '卡尔·拉格斐', '卡尔·拉格斐巴黎', '卡尔～', '卡尔', '卡尔巴黎', '卡尔经', '卡尔经巴黎', '卡尔经', '情侣款']},
        { canonical: 'Converse', variants: ['Converse', 'Converse', 'Converse', 'CONVERSE', 'converse', '匡威', '匡威巴黎', '匡～', '匡～', '匡威', '匡威巴黎', '匡～', '匡～']},
        { canonical: 'Common Projects', variants: ['Common Projects', 'Common Projects', 'Common Projects', 'COMMON PROJECTS', 'common projects', 'COMMON ', 'CP～', 'cp～']},
        { canonical: 'Zara', variants: ['Zara', 'ZARA', 'Zara', 'zara', '扎拉', '扎拉巴黎', '扎～']},
        { canonical: 'Premiata', variants: ['Premiata', 'Premiata', 'Premiata', 'PREMIATA', 'premiata', 'PRM', 'prm', 'PRM～', 'prm～', 'PRM', 'prm', 'PRM～', 'prm～']},
        { canonical: 'Rick Owens', variants: ['Rick Owens', 'Rick Owens', 'Rick Owens', 'RICK OWENS', 'rick owens', 'RICK ', 'RO～', 'ro～', 'RO～', 'ro～', '欧～']}
    ];
    // Приводим заголовок к нижнему регистру для поиска
    const lowerTitle = title.toLowerCase();
    
    // Ищем бренд
    for (const brand of brands) {
        for (const variant of brand.variants) {
            if (lowerTitle.includes(variant.toLowerCase())) {
                return brand.canonical; // Возвращаем каноническое написание бренда
            }
        }
    }
    // Если бренд не найден, очищаем строку: оставляем латинские буквы, цифры, пробелы, дефис и апостроф
    // return title.replace(/[^\w\s-'’]/g, '').trim().replace(/\s+/g, ' ');
    
    // Если бренд не найден, очищаем строку: и подставляем значение из nm2
    // return args[1] || args[0] || args[2];
    
    // Если бренд не найден, очищаем строку: и подставляем значение из nm2
    return  `${args[1]}` || `${args[0]}` || title.replace(/[^\w\s-'’]/g, '').trim().replace(/\s+/g, ' ');
}

module.exports = {
    foundBrand,
    prepareTitle,
    prepareTitle2,
    prepareTitle3
};

// Если бренд не найден, очищаем строку: оставляем латинские буквы, цифры, пробелы, дефис и апостроф
// return title.replace(/[^\w\s-'’]/g, '').trim().replace(/\s+/g, ' ');
