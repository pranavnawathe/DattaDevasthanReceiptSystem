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
        org: (orgId) => `ORG#${orgId}`,
    },
    SK: {
        receipt: (receiptNo) => `RCPT#${receiptNo}`,
        donor: (donorId) => `DONOR#${donorId}`,
        aliasPhone: (phone) => `ALIAS#PHONE#${phone}`,
        aliasPAN: (panHash) => `ALIAS#PAN#${panHash}`,
        aliasEmail: (emailHash) => `ALIAS#EMAIL#${emailHash}`,
        counter: (year) => `COUNTER#RECEIPT#${year}`,
        range: (rangeId) => `RANGE#${rangeId}`,
    },
    GSI1: {
        donor: (donorId) => `DONOR#${donorId}`,
        donorReceipt: (date, receiptNo) => `DATE#${date}#RCPT#${receiptNo}`,
    },
    GSI2: {
        date: (date) => `DATE#${date}`,
        receipt: (receiptNo) => `RCPT#${receiptNo}`,
    },
};
