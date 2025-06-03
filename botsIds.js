
const { Api } = require("telegram");

const botUsernames = [ "cvpost1_bot","cvpost2_bot","cvpost3_bot","cvpost4_bot","cvpost5_bot","cvpost6_bot","cvpost7_bot","cvpost8_bot","cvpost9_bot","cvpost10_bot","cvpost11_bot","cvpost12_bot","cvpost13_bot","cvpost14_bot","cvpost15_bot","cvpost16_bot","cvpost17_bot","cvpost18_bot","cvpost19_bot","cvpost20_bot","cvpost21_bot","cvpost22_bot","cvpost23_bot","cvpost24_bot","cvpost25_bot","cvpost26_bot","cvpost27_bot","cvpost28_bot","cvpost29_bot","cvpost30_bot" ];


 const rights = new Api.ChatAdminRights({
    changeInfo: false,
    postMessages: true,
    editMessages: true,
    deleteMessages: true,
    banUsers: false,
    inviteUsers: true,
    pinMessages: true,
    addAdmins: false,
    anonymous: false,
    manageCall: false,
    other: true,
  });



module.exports = { botUsernames, rights };  
