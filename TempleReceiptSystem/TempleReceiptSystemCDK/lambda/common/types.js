"use strict";
/**
 * Type definitions for Temple Receipt System
 * Matches the design document data model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keys = exports.DonationPurpose = exports.PaymentMode = exports.RangeStatus = void 0;
/**
 * Range status enum
 */
var RangeStatus;
(function (RangeStatus) {
    RangeStatus["DRAFT"] = "draft";
    RangeStatus["ACTIVE"] = "active";
    RangeStatus["LOCKED"] = "locked";
    RangeStatus["EXHAUSTED"] = "exhausted";
    RangeStatus["ARCHIVED"] = "archived";
})(RangeStatus || (exports.RangeStatus = RangeStatus = {}));
/**
 * Payment modes
 */
var PaymentMode;
(function (PaymentMode) {
    PaymentMode["CASH"] = "CASH";
    PaymentMode["UPI"] = "UPI";
    PaymentMode["CHEQUE"] = "CHEQUE";
    PaymentMode["NEFT"] = "NEFT";
    PaymentMode["RTGS"] = "RTGS";
    PaymentMode["CARD"] = "CARD";
    PaymentMode["ONLINE"] = "ONLINE";
})(PaymentMode || (exports.PaymentMode = PaymentMode = {}));
/**
 * Donation purposes / categories
 * These are configurable per organization
 */
var DonationPurpose;
(function (DonationPurpose) {
    DonationPurpose["UTSAV_DANAGI"] = "UTSAV_DANAGI";
    DonationPurpose["GENERAL"] = "GENERAL";
    DonationPurpose["PRASAD"] = "PRASAD";
    DonationPurpose["POOJA"] = "POOJA";
    DonationPurpose["MAINTENANCE"] = "MAINTENANCE";
    DonationPurpose["SEVA"] = "SEVA";
    DonationPurpose["EDUCATION"] = "EDUCATION";
    DonationPurpose["ANNADAAN"] = "ANNADAAN";
    DonationPurpose["OTHER"] = "OTHER";
})(DonationPurpose || (exports.DonationPurpose = DonationPurpose = {}));
/**
 * Constants for key patterns
 */
exports.Keys = {
    PK: {
        org: function (orgId) { return "ORG#".concat(orgId); },
    },
    SK: {
        receipt: function (receiptNo) { return "RCPT#".concat(receiptNo); },
        donor: function (donorId) { return "DONOR#".concat(donorId); },
        aliasPhone: function (phone) { return "ALIAS#PHONE#".concat(phone); },
        aliasPAN: function (panHash) { return "ALIAS#PAN#".concat(panHash); },
        aliasEmail: function (emailHash) { return "ALIAS#EMAIL#".concat(emailHash); },
        counter: function (year) { return "COUNTER#RECEIPT#".concat(year); },
        range: function (rangeId) { return "RANGE#".concat(rangeId); },
    },
    GSI1: {
        donor: function (donorId) { return "DONOR#".concat(donorId); },
        donorReceipt: function (date, receiptNo) { return "DATE#".concat(date, "#RCPT#").concat(receiptNo); },
    },
    GSI2: {
        date: function (date) { return "DATE#".concat(date); },
        receipt: function (receiptNo) { return "RCPT#".concat(receiptNo); },
    },
};
