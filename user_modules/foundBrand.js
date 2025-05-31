function prepareTitle(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】 или《 》 или 「 」
    const match = title.match(/[\[【《「]([^\]】》」]+)[\]】》」]/); 
    return match ? match[1].trim() : '';
}

function foundBrand(title) {
    // Список брендов с вариантами написания
    const brands = [
        // { canonical: 'D&G',variants: ['D&G', 'Dolce & Gabbana', 'Dolce Gabbana', 'DGdg', 'DG', 'dg', 'DG*', 'DG*', 'G', 'G logo',]},
        { canonical: 'Dior', variants: ['Dior', 'Christian Dior', 'ChristianDior', 'DIOR', 'dior', 'dio', 'Dio', '迪奥', '迪奥巴黎', '迪奥～', '迪～'] },
        { canonical: 'Fendi', variants: ['Fendi', 'Fendi Roma', 'FendiRoma', 'FENDI', 'fendi', 'Fendi*', 'Fendi*', 'FD', 'FEND*', 'FEND', 'Fedi', 'Fe*di', '芬迪', '芬迪巴黎', '芬～'] },
        { canonical: 'Tod’s', variants: ['Tod’s', 'Tods', 'Tod s', 'Tod', 'TODS', 'tods'] },
        { canonical: 'Prada', variants: ['Prada', 'Prada Milano', 'PradaMilan', 'PRADA', 'pRADA', 'P R A D A', '普拉达', '普拉达米兰', '普～'] },
        { canonical: 'Hermes', variants: ['Hermes', 'Hermès', 'Hermes Paris', 'HERMES', 'HermesParis', 'HERME', 'HERMESTPR', 'HERMES HERMES', 'HER MES', 'HERME Bouncing', 'Bouncing', 'HERME Bouncing', 'Bouncing', '爱马仕', '爱马仕巴黎', '爱～'] },
        { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani', 'VALENTINO', 'valentino', 'VALENTIN*', 'Valentin*', '华伦天奴', '华伦天奴巴黎', '华～'] },
        { canonical: 'Trillionaire', variants: ['Trillionaire', 'TRILLIONAIRE', 'Trillionaire', 'trillionaire', 'TRILLION*', 'Trillion*', '3illionaire', '3illion*', '特里利安尼']},
        { canonical: 'Loro Piana', variants: ['Loro Piana', 'LORO PIANA', 'LoroPiana', 'LORO PIANA*', 'LoroPiana*', 'LORO', 'loro', 'Lp', 'LP', '罗洛·皮亚纳']},
        { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci', 'Balenciaga Paris', 'BALENCIAGA', 'balenciaga', 'BALENCICGA', '巴黎世家'] },
        { canonical: 'Dsquared2',variants: ['Dsquared2', 'Dsquared', 'Dsquared2', 'DSQUARED2', 'dsquared2', 'DSQUARED*', 'D2']},
        { canonical: 'Moncler', variants: ['Moncler', 'MONCLER', 'Moncler', 'moncler', 'MONCLER*', 'Moncler*', 'moncler', 'Moncle', 'Moncle*', '蒙克莱', '蒙克莱巴黎', '蒙～']},
        { canonical: 'Ferragamo',variants: ['Ferragamo', 'Salvatore Ferragamo', 'Ferraga', 'F Gancini', '菲拉格慕', '牛里', '牛里奥']},
        { canonical: 'Givenchy', variants: ['Givenchy', 'GIVENCHY', 'Givenchy Paris', 'G I V E N C H Y', 'GIVENCHY', 'givenchy', '纪梵希', '纪梵希巴黎', '纪～'] },
        { canonical: 'Tom Ford',variants: ['Tom Ford', 'TOM FORD', 'Tom Ford', 'tom ford', 'TOMF ORD', '汤姆·福特']},
        { canonical: 'Versace', variants: ['Versace', 'Gianni Versace', 'Versace Italy', 'VERACE', 'versace', 'VERACE*', '范思哲', '范思哲巴黎', '范～'] },
        { canonical: 'Armani', variants: ['Armani', 'Giorgio Armani', 'GiorgioArmani', 'ARMANI', 'armani', 'Emporio Armani', 'EMPORIO ARMANI', 'Emporio ar', 'Emporio Ar', '-ARMARNI', '乔治·阿玛尼', '乔治·阿玛尼巴黎', '乔治～'] },
        { canonical: 'Gucci', variants: ['Gucci', 'Gucci Italy', 'GUCCI', 'gucci', 'GUCC*', 'Gucc*', '古驰', '古驰巴黎', '古～', 'G 🔍', '-GUCCl', 'GUCCl'] },
        { canonical: 'Amiri', variants: ['Amiri', 'Amiri LA', 'AmiriLosAngeles', 'AMIRI', 'amiri', 'AMIR*', 'Amir*', '阿米里'] },
        { canonical: 'Boss', variants: ['Boss', 'BOSS', 'Hugo Boss', 'HugoBoss', 'BOOS', 'boss', 'BOSS*', 'Boss*', 'BO' , 'bo', '博斯', '博斯巴黎', '博～', 'ＢＯＳＳ'] },
        { canonical: 'Off-White', variants: ['Off-White', 'Off White', 'OffWhite', 'OFF WHITE', 'off white'] },
        { canonical: 'Chanel', variants: ['Chanel', 'CHANEL', 'Chanel Paris', 'Chanel', 'chanel', 'CHANEL*', 'Chanel*', '香奈儿', '香奈儿巴黎', '香～']},
        { canonical: 'Kenzo', variants: ['Kenzo', 'KENZO', 'Kenzo Paris', 'KENZO', 'kenzo', 'KENZO*', 'Kenzo*', '高田贤三', '高田贤三巴黎', '高～']},
        { canonical: 'Bally', variants: ['Bally', 'BALLY', 'Bally', 'bally', 'BALLY*', 'Bally*', '巴利', '巴利巴黎', '巴～']},
        { canonical: 'Balmain', variants: ['Balmain', 'BALMAIN', 'Balmain', 'balmain', 'BALMAIN*', 'Balmain*', '巴尔曼']},
        { canonical: 'Nike', variants: ['Nike', 'NIKE', 'Nike', 'nike', 'NIKE*', 'Nike*', 'Nike Dunk Low', 'Nike Dunk', 'Nike Dunk SB', 'Nike SB', 'Nike SB Dunk', 'Nike SB Dunk Low', 'Nike SB Dunk High', 'Nike SB Dunk Pro', 'Nike SB Dunk Pro Low', 'Nike SB Dunk Pro High', '耐克']},
        { canonical: 'Hogan', variants: ['HOGAN', 'Hogan', 'hogan', 'Hogan*', 'hogan*', '霍根']},
        { canonical: 'Y-3', variants: ['Y-3', 'Y3']},
        { canonical: 'COACH', variants: ['COACH', 'Coach', 'COACH*', 'Coach*', '蔻驰', '蒄～']},
        { canonical: 'MIUMIU', variants: ['MIUMIU', 'Miu Miu', 'Miu Miu', 'MIUMIU', 'miu miu', 'MIUMIU*', 'MiuMiu*', '原单品质•独家首发', '缪缪', '缪缪巴黎', '缪～']},
        { canonical: 'Santoni', variants: ['Santoni', 'Santoni Shoes', 'SANTONI', 'santoni'] },
        { canonical: 'Olympia', variants: ['Olympia', 'OLYMPIA', 'Olympia', 'olympia', 'OLYMPIA*', 'Olympia*', '奥林匹亚']},
        { canonical: 'Burberry', variants: ['Burberry', 'Burberry London', 'Burberry London', 'BURBERRY', 'burberry', 'BURB*', 'Burb*', 'Burrberr*', '博柏利'] },
        { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani', 'VALENTINO', 'valentino', 'VALENTIN*', 'Valentin*', 'VLTN', '华伦天奴', '华伦天奴巴黎', '华～']},
        { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci', 'Balenciaga Paris', 'BALENCIAGA', 'balenciaga', 'BALENCICGA', '巴黎世家']},
        { canonical: 'Thom Browne', variants: ['Thom Browne', 'Thom Browne', 'Thom Browne', 'THOM BROWNE', 'TH0M BR0WNE', 'thom browne', 'THOM BROWNE*', 'ThomBrowne*', 'TB', '汤姆·布朗']},
        { canonical: 'Stefano Ricci', variants: ['Stefano Ricci', 'Stefano Ricci', 'Stefano Ricci', 'STEFANO RICCI', 'stefano ricci', 'STEFANO RICCI*', 'StefanoRicci*', '斯蒂芬诺·里奇']},
        { canonical: 'Philipp Plein', variants: ['Philipp Plein', 'Plein', 'PhilippPlein', 'PP', 'P-P', 'Pp', 'pHILIpp pLEIN', '菲利普·普莱恩'] },
        { canonical: 'Louis Vuitton', variants: ['Louis Vuitton', 'LV', 'Lv', 'LVLV', 'LouisVuitton', 'lv-', 'LOUIS VUITTON', 'louis vuitton', '*OUIS *UITTO*', 'LOUI VUITTO', 'LOUIS UITTO', 'Louis V ', '路易威登', 'L家', 'L经'] },
        { canonical: 'Bottega Veneta', variants: ['Bottega Veneta', 'Bottega', 'BottegaVeneta', 'BV', 'bottega veneta', 'BOTTEGA VENETA', '葆蝶家'] },
        { canonical: 'Dolce & Gabbana', variants: ['Dolce & Gabbana', 'Dolce Gabbana', 'D&G', 'DolceGabbana','DGdg', 'DG', 'dg', 'DG*', 'DG*', 'G logo',] },
        { canonical: 'Village Garavani', variants: ['Village Garavani', 'Village Garavani', 'Village Garavani', 'VILLAGE GARAVANI', 'village garavani', 'VILLAGE GARAVANI*', 'VillageGaravani*', '维尔村·加拉瓦尼']},
        { canonical: 'Ermenegildo Zegna', variants: ['Ermenegildo Zegna', 'Zegna', 'ErmenegildoZegna', 'EZegna', 'ZegnaZegna', 'ZEGNA', 'zegna', '杰尼亚'] },
        { canonical: 'Brunello Cucinelli', variants: ['Brunello Cucinelli', 'Cucinelli', 'BrunelloCucinelli', 'BRUNELLO CUCINELLI', 'brunello cucinelli', 'BRUNELLO CUCINELLI', 'BrunelloCucinelli', 'BC', '布兰诺'] },
        { canonical: 'Alexander McQueen', variants: ['Alexander McQueen', 'McQueen', 'AlexanderMcQueen', '亚历山大·麦昆', '亚历山大·麦昆巴黎', '亚～'] },
        { canonical: 'Giuseppe Zanotti', variants: [ 'Giuseppe Zanotti', 'GZ', 'GZ*']},
        
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
    return title.replace(/[^\w\s-'’]/g, '').trim().replace(/\s+/g, ' ');
}
module.exports = {
    foundBrand,
    prepareTitle
};

