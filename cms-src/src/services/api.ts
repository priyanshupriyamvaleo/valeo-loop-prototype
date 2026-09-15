// ══════════════════════════════════════════════════════════════════════════════
// ApiService — the prototype's data layer
//
// ⚠️ READ THIS BEFORE ADDING ANYTHING HERE.
//
// This file used to be ALL mock data. It is now a mix, and which is which matters:
//
//   REAL — delegates to the content service. Do not add rows to these.
//     · listings            -> GET /products          (src/lib/api/product-list.ts)
//     · cities              -> GET /cities
//     · internalCategories  -> GET /internal-categories
//     · subDepartments      -> GET /departments        (callers prefer fetchDepartments)
//
//   LOCAL — no endpoint exists. The prototype owns this data, and saying so is the
//   point: `local` is section-sync's vocabulary for "not saved to the service" as
//   distinct from "lost". Every one of these is a screen that cannot be made real
//   until its API is built:
//     journeys · categories · subCategories · tags · partners · healthTeam · audit
//     promoBanners · flashSales · retention · protocols · compositions · articles
//     serviceProviders · questionnaires · biomarkers · diagnosticsLabs · surveys
//     profiles · campaigns · orders · logistics · zohoBookItems · unicommerceSkus
//
// When an endpoint lands: point the function here at it (one boundary, so every
// caller switches at once — see `listings` and `internalCategories` for the shape),
// delete the rows, and move its name from LOCAL to REAL above.
//
// The rule that makes this safe: a REAL function must NEVER fall back to mock rows
// on failure. A picker silently offering invented items is how an invented id gets
// saved against a real product.
// ══════════════════════════════════════════════════════════════════════════════

import {
    Article, ArticleCategory, AuditChange, Banner, Biomarker, BiomarkerCode, BiomarkerLabMapping,
    BiomarkerPanel, BiomarkerRange, Campaign, CataloguePartner, CodeScheme, CyotComponentPrice,
    CyotConfig, RangeGrade,
    Category, CategoryManager, City, Composition, ContentCategory, ContentItem, Country,
    DiagnosticsLab, Expert, FlashSale, HealthProfile, InternalCategory, Journey, Listing,
    LogisticCenter, Order, Partner, Practitioner, Product, PromoBanner, Protocol,
    Questionnaire, Region, RetentionMessage, RetentionSection, RetentionTemplate, SampleKind,
    ScoringRule, ServiceProvider, SlotGroup, SocialProof, SubCategory, SubDepartment, Survey,
    Tag, TagNamespace, TagStatus, User,
} from "@/types"
import { withDerivedPanelGroups } from "@/lib/biomarkers"
import { fetchInternalCategories } from "@/lib/api/internal-categories"
import { fetchAllProducts, fetchCities } from "@/lib/api/catalogue-sources"
import {
    MIGRATED_CATEGORIES,
    MIGRATED_SUBCATEGORIES,
    MIGRATED_LISTINGS,
} from "./catalogue-data"
import {
    PACKAGE_CATEGORIES,
    PACKAGE_SUBCATEGORIES,
    PACKAGE_LISTINGS,
} from "./catalogue-data-packages"
import { DHC_LISTINGS } from "./catalogue-data-dhc"
import { HEALTH_TEAM } from "./catalogue-data-health-team"
import { listingDefaults } from "@/lib/catalogue"
import { SUB_DEPARTMENTS, buildInternalCode } from "@/lib/taxonomy"
import { diffEntities, LISTING_LABELS, LISTING_AUDIT_IGNORE } from "@/lib/audit-diff"
import { auditStore } from "./audit"

const MOCK_DELAY = 600

async function mockFetch<T>(data: T): Promise<T> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(data), MOCK_DELAY)
    })
}

const MOCK_PRODUCTS: Product[] = [
    {
        id: "p1",
        internalName: "comprehensive-male-profile",
        displayNameEn: "Comprehensive Male Profile",
        displayNameAr: "الملف الشخصي الشامل للذكور",
        type: "package",
        subCategory: "Full Panel",
        category: "General Health",
        brand: "Valeo",
        status: "active",
        visibility: "public",
        slugEn: "comprehensive-male-profile",
        slugAr: "comprehensive-male-profile-ar",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-03-10T12:00:00Z",

        isPrescriptionRequired: false,
        isOtc: false,
        requiresConsultation: false,
        isControlledSubstance: false,
        regulatoryBadges: ["moh_approved", "clinically_tested"],

        descriptionEn: "Our most comprehensive male health panel covering 50+ biomarkers for a complete picture of your health.",
        descriptionAr: "أشمل لوحة صحية للرجال تغطي أكثر من 50 مؤشراً حيوياً لصورة كاملة عن صحتك.",
        shortDescriptionEn: "50+ biomarkers. Full-spectrum health assessment for men.",
        shortDescriptionAr: "أكثر من 50 مؤشراً حيوياً. تقييم صحي شامل للرجال.",
        benefits: [
            { iconKey: "heart", labelEn: "Heart health", labelAr: "صحة القلب", descriptionEn: "Lipid panel and cardiac markers", descriptionAr: "لوحة الدهون ومؤشرات القلب" }
        ],
        ingredients: [],
        trustBadges: ["authentic", "secure_payment"],
        mediaGallery: [
            { assetId: "m1", type: "image", url: "", altTextEn: "Male Profile Kit", altTextAr: "مجموعة الملف الشخصي للذكور", sortOrder: 0, isHero: true }
        ],
        deliveryConfig: [
            { city: "Dubai", deliveryTime: "Same Day", isAvailable: true },
            { city: "Abu Dhabi", deliveryTime: "48 hours", isAvailable: true }
        ],

        subscriptionEnabled: false,
        subscriptionAutoSelected: false,
        subscriptionFrequencies: [],
        subscriptionDiscountPct: {},
        subscriptionMinCycles: 1,
        multiBuyTiers: [],
        bundles: [],

        enhancements: [],
        frequentlyBoughtTogether: [],
        biomarkerPackages: [],
        consultationAddonEnabled: false,
        consultationAddonPrice: 0,
        giftWrappingEnabled: false,
        giftWrappingPrice: 0,
        extendedDeliveryEnabled: false,

        seoTitleEn: "Comprehensive Male Health Profile | Valeo",
        seoTitleAr: "الملف الصحي الشامل للرجال | فاليو",
        seoDescriptionEn: "Get a complete picture of your health with 50+ biomarkers.",
        seoDescriptionAr: "احصل على صورة كاملة عن صحتك مع أكثر من 50 مؤشراً حيوياً.",

        hideVariantsOnConsultationLink: false,
        forceVariantDisplay: false,
        variantVisibilityUrlOverrideEnabled: true,
        subscriptionAutoSelectOverride: null,
        showCompareAtPrice: true,
        showStockIndicator: false,
        showDeliveryEstimate: true,
        consultationLinkSuppressesAddons: true,

        faq: [
            { questionEn: "What is included?", questionAr: "ماذا يشمل؟", answerEn: "50+ biomarkers including hormones, lipids, vitamins.", answerAr: "أكثر من 50 مؤشراً بما في ذلك الهرمونات والدهون والفيتامينات.", sortOrder: 0 }
        ],

        reviews: [
            { id: "r1", reviewerName: "Ahmed Al Rashidi", rating: 5, reviewTextEn: "The most comprehensive health panel I've ever taken. Results were clear and actionable.", isVerified: true, photoUrl: "", sortOrder: 0 },
            { id: "r2", reviewerName: "Sarah Mitchell", rating: 5, reviewTextEn: "Incredibly detailed results. My doctor was impressed by the panel coverage.", isVerified: true, sortOrder: 1 }
        ],
        influencerVideos: [
            { id: "iv1", handle: "@valeohealth", platform: "instagram", videoUrl: "", thumbnailUrl: "", captionEn: "Full blood panel review — everything you need to know", sortOrder: 0 }
        ],
        superiorityBlock: {
            headlineEn: "Why the Comprehensive Male Profile is the Gold Standard",
            headlineAr: "لماذا يعتبر الملف الشامل للذكور المعيار الذهبي",
            mediaType: null, mediaUrl: "", thumbnailUrl: "",
            points: [
                { titleEn: "50+ Biomarkers", titleAr: "أكثر من 50 مؤشراً حيوياً", descriptionEn: "More comprehensive than any standard GP blood test.", descriptionAr: "أشمل من أي فحص دم طبي قياسي." },
                { titleEn: "Same-Day Results", titleAr: "نتائج في نفس اليوم", descriptionEn: "Get your results digitally within hours, not days.", descriptionAr: "احصل على نتائجك رقمياً في غضون ساعات، لا أيام." }
            ]
        },

        variants: [
            {
                id: "v1",
                slugEn: "comprehensive-male-profile-standard",
                slugAr: "comprehensive-male-profile-standard-ar",
                nameEn: "Standard",
                nameAr: "قياسي",
                variantType: "quantity",
                variantLabelEn: "Standard",
                variantLabelAr: "قياسي",
                vat: 5,
                isDefault: true,
                sortOrder: 0,
                status: "active",
                stockQuantity: 100,
                customFields: {},
                regionalData: [
                    { country: "UAE", sku: "CMP-UAE-001", zohoId: "ZH-UAE-1001", price: 999, isAvailable: true },
                    { country: "KSA", sku: "CMP-KSA-001", zohoId: "ZH-KSA-1001", price: 1050, isAvailable: true }
                ]
            },
            {
                id: "v2",
                slugEn: "comprehensive-male-profile-premium",
                slugAr: "comprehensive-male-profile-premium-ar",
                nameEn: "Premium",
                nameAr: "مميز",
                variantType: "quantity",
                variantLabelEn: "Premium",
                variantLabelAr: "مميز",
                vat: 5,
                isDefault: false,
                sortOrder: 1,
                status: "active",
                stockQuantity: 45,
                lowStockThreshold: 10,
                customFields: {},
                regionalData: [
                    { country: "UAE", sku: "CMP-UAE-002", zohoId: "ZH-UAE-1002", price: 1499, isAvailable: true },
                    { country: "KSA", sku: "CMP-KSA-002", zohoId: "ZH-KSA-1002", price: 1600, isAvailable: true }
                ]
            }
        ]
    },
    {
        id: "p2",
        internalName: "vitamin-d-boost",
        displayNameEn: "Vitamin D3 Boost",
        displayNameAr: "تعزيز فيتامين د3",
        type: "supplement",
        subCategory: "vitamin",
        category: "Vitamins",
        brand: "Valeo Nutrition",
        status: "active",
        visibility: "public",
        slugEn: "vitamin-d3-boost",
        slugAr: "vitamin-d3-boost-ar",
        createdAt: "2024-02-01T09:00:00Z",
        updatedAt: "2024-03-12T08:00:00Z",

        isPrescriptionRequired: false,
        isOtc: true,
        requiresConsultation: false,
        isControlledSubstance: false,
        regulatoryBadges: ["authentic"],

        descriptionEn: "High-potency Vitamin D3 for immune support, bone health, and mood balance. Third-party tested for purity.",
        descriptionAr: "فيتامين د3 عالي الفاعلية لدعم المناعة وصحة العظام وتوازن المزاج.",
        shortDescriptionEn: "High-potency D3 for immune & bone health.",
        shortDescriptionAr: "د3 عالي الفاعلية لصحة المناعة والعظام.",
        benefits: [
            { iconKey: "shield", labelEn: "Immune Support", labelAr: "دعم المناعة", descriptionEn: "Clinically shown to support immune function", descriptionAr: "مثبت سريرياً لدعم وظيفة المناعة" },
            { iconKey: "bone", labelEn: "Bone Health", labelAr: "صحة العظام", descriptionEn: "Supports calcium absorption for strong bones", descriptionAr: "يدعم امتصاص الكالسيوم لعظام قوية" }
        ],
        ingredients: [
            { nameEn: "Vitamin D3 (Cholecalciferol)", nameAr: "فيتامين د3", amount: 5000, unit: "IU", dailyValuePct: 625 }
        ],
        trustBadges: ["authentic", "clinically_tested"],
        mediaGallery: [
            { assetId: "m2", type: "image", url: "", altTextEn: "Vitamin D3 Bottle", altTextAr: "زجاجة فيتامين د3", sortOrder: 0, isHero: true }
        ],
        deliveryConfig: [
            { city: "Dubai", deliveryTime: "Same Day", isAvailable: true },
            { city: "Sharjah", deliveryTime: "24 hours", isAvailable: true }
        ],

        subscriptionEnabled: true,
        subscriptionAutoSelected: true,
        subscriptionFrequencies: ["monthly", "quarterly"],
        subscriptionDiscountPct: { monthly: 10, quarterly: 15 },
        subscriptionSavingsLabelEn: "Save up to 15% with a subscription",
        subscriptionSavingsLabelAr: "وفر حتى 15% مع الاشتراك",
        subscriptionTermsEn: "Cancel anytime. No hidden fees.",
        subscriptionTermsAr: "إلغاء في أي وقت. لا رسوم خفية.",
        subscriptionMinCycles: 1,
        multiBuyTiers: [
            { minQuantity: 2, discountPct: 5 },
            { minQuantity: 3, discountPct: 10 }
        ],
        bundles: [],

        enhancements: [],
        frequentlyBoughtTogether: [],
        biomarkerPackages: [],
        consultationAddonEnabled: false,
        consultationAddonPrice: 0,
        giftWrappingEnabled: false,
        giftWrappingPrice: 0,
        extendedDeliveryEnabled: false,

        seoTitleEn: "Vitamin D3 5000 IU Supplement | Valeo",
        seoTitleAr: "مكمل فيتامين د3 5000 وحدة | فاليو",
        seoDescriptionEn: "High-potency Vitamin D3 for immune support and bone health. Subscribe and save up to 15%.",
        seoDescriptionAr: "فيتامين د3 عالي الفاعلية لدعم المناعة وصحة العظام. اشترك ووفر حتى 15%.",

        hideVariantsOnConsultationLink: false,
        forceVariantDisplay: false,
        variantVisibilityUrlOverrideEnabled: true,
        subscriptionAutoSelectOverride: null,
        showCompareAtPrice: true,
        showStockIndicator: true,
        showDeliveryEstimate: true,
        consultationLinkSuppressesAddons: true,

        faq: [],

        reviews: [
            { id: "r3", reviewerName: "Lina Khoury", rating: 5, reviewTextEn: "My Vitamin D was critically low. After 3 months on this I feel like a different person.", isVerified: true, photoUrl: "", sortOrder: 0 },
            { id: "r4", reviewerName: "James O'Brien", rating: 4, reviewTextEn: "Great product, noticeable improvement in energy levels within 6 weeks.", isVerified: true, sortOrder: 1 },
            { id: "r5", reviewerName: "Noor Al Sayed", rating: 5, reviewTextEn: "Love that it's third-party tested. Subscribing monthly now.", reviewTextAr: "أحب أنه مختبر من طرف ثالث. أشترك شهرياً الآن.", isVerified: true, videoUrl: "", videoThumbnailUrl: "", sortOrder: 2 }
        ],
        influencerVideos: [
            { id: "iv2", handle: "@healthwithlina", platform: "instagram", videoUrl: "", thumbnailUrl: "", captionEn: "My Vitamin D routine — why I switched to Valeo D3", sortOrder: 0 },
            { id: "iv3", handle: "@fitnessdubai", platform: "tiktok", videoUrl: "", thumbnailUrl: "", captionEn: "Valeo Vitamin D3 5000 IU honest review", sortOrder: 1 }
        ],
        superiorityBlock: {
            headlineEn: "Why Valeo Vitamin D3 is Superior",
            headlineAr: "لماذا فيتامين د3 من فاليو متفوق",
            mediaType: null, mediaUrl: "", thumbnailUrl: "",
            points: [
                { titleEn: "5000 IU High Potency", titleAr: "5000 وحدة دولية عالية الفاعلية", descriptionEn: "Optimal dose clinically shown to restore deficient levels within 8–12 weeks.", descriptionAr: "الجرعة المثلى المثبتة سريرياً لاستعادة المستويات الناقصة." },
                { titleEn: "Cholecalciferol (D3) Not D2", titleAr: "كوليكالسيفيرول (د3) وليس د2", descriptionEn: "D3 is 87% more potent than D2 at raising and maintaining serum 25(OH)D levels.", descriptionAr: "د3 أقوى بنسبة 87% من د2 في رفع مستويات المصل." },
                { titleEn: "Third-Party Tested", titleAr: "مختبر من طرف ثالث", descriptionEn: "Every batch independently verified for purity, potency, and absence of contaminants.", descriptionAr: "كل دفعة يتم التحقق منها بشكل مستقل للنقاء والفاعلية." },
                { titleEn: "Subscribe & Save up to 15%", titleAr: "اشترك ووفر حتى 15%", descriptionEn: "Consistency is key. Lock in your price and never run out with a flexible subscription.", descriptionAr: "الاتساق هو المفتاح. احجز سعرك ولا تنفد مطلقاً." }
            ]
        },

        variants: [
            {
                id: "v3",
                slugEn: "vitamin-d3-boost-60caps",
                slugAr: "vitamin-d3-boost-60caps-ar",
                nameEn: "60 Capsules",
                nameAr: "60 كبسولة",
                variantType: "quantity",
                variantLabelEn: "60 Caps",
                variantLabelAr: "60 كبسولة",
                vat: 5,
                isDefault: true,
                sortOrder: 0,
                status: "active",
                stockQuantity: 200,
                customFields: {},
                regionalData: [
                    { country: "UAE", sku: "VD3-UAE-060", zohoId: "ZH-UAE-2001", price: 89, isAvailable: true },
                    { country: "KSA", sku: "VD3-KSA-060", zohoId: "ZH-KSA-2001", price: 95, isAvailable: true },
                    { country: "QATAR", sku: "VD3-QAT-060", zohoId: "ZH-QAT-2001", price: 92, isAvailable: true }
                ]
            },
            {
                id: "v4",
                slugEn: "vitamin-d3-boost-120caps",
                slugAr: "vitamin-d3-boost-120caps-ar",
                nameEn: "120 Capsules",
                nameAr: "120 كبسولة",
                variantType: "quantity",
                variantLabelEn: "120 Caps",
                variantLabelAr: "120 كبسولة",
                vat: 5,
                isDefault: false,
                sortOrder: 1,
                status: "active",
                stockQuantity: 8,
                lowStockThreshold: 10,
                compareAtPriceOverride: 179,
                customFields: {},
                regionalData: [
                    { country: "UAE", sku: "VD3-UAE-120", zohoId: "ZH-UAE-2002", price: 149, isAvailable: true },
                    { country: "KSA", sku: "VD3-KSA-120", zohoId: "ZH-KSA-2002", price: 160, isAvailable: true }
                ]
            }
        ]
    },
    {
        id: "p3",
        internalName: "glp1-semaglutide",
        displayNameEn: "Semaglutide (GLP-1)",
        displayNameAr: "سيماغلوتيد (GLP-1)",
        type: "medicine",
        subCategory: "GLP-1 agonist",
        category: "Weight Management",
        brand: "Novo Nordisk",
        status: "active",
        visibility: "unlisted",
        slugEn: "semaglutide-glp1",
        slugAr: "semaglutide-glp1-ar",
        createdAt: "2024-01-20T11:00:00Z",
        updatedAt: "2024-03-08T16:00:00Z",

        isPrescriptionRequired: true,
        isOtc: false,
        requiresConsultation: true,
        isControlledSubstance: false,
        regulatoryBadges: ["moh_approved"],

        medicineGenericName: "Semaglutide",
        medicineDisclaimerEn: "This medicine is only available with a valid prescription. Use only as directed by your physician.",
        medicineDisclaimerAr: "هذا الدواء متاح فقط بوصفة طبية صالحة. استخدمه فقط بتوجيه من طبيبك.",
        medicineMechanismEn: "Semaglutide is a GLP-1 receptor agonist that reduces appetite and slows gastric emptying.",
        medicineMechanismAr: "سيماغلوتيد هو ناهض مستقبل GLP-1 يقلل الشهية ويبطئ إفراغ المعدة.",

        descriptionEn: "Semaglutide is a GLP-1 receptor agonist prescribed for chronic weight management in adults.",
        descriptionAr: "سيماغلوتيد ناهض مستقبل GLP-1 موصوف لإدارة الوزن المزمنة لدى البالغين.",
        shortDescriptionEn: "Prescription GLP-1 for chronic weight management.",
        shortDescriptionAr: "GLP-1 بوصفة طبية لإدارة الوزن المزمنة.",
        benefits: [],
        ingredients: [],
        trustBadges: ["moh_approved"],
        mediaGallery: [
            { assetId: "m3", type: "image", url: "", altTextEn: "Semaglutide Pen", altTextAr: "قلم سيماغلوتيد", sortOrder: 0, isHero: true }
        ],
        deliveryConfig: [
            { city: "Dubai", deliveryTime: "24 hours", isAvailable: true }
        ],

        subscriptionEnabled: true,
        subscriptionAutoSelected: false,
        subscriptionFrequencies: ["monthly"],
        subscriptionDiscountPct: { monthly: 8 },
        subscriptionMinCycles: 3,
        multiBuyTiers: [],
        bundles: [],

        enhancements: [],
        frequentlyBoughtTogether: [],
        biomarkerPackages: [{ productId: "p1", variantId: "v1" }],
        consultationAddonEnabled: true,
        consultationAddonPrice: 299,
        giftWrappingEnabled: false,
        giftWrappingPrice: 0,
        extendedDeliveryEnabled: false,

        seoTitleEn: "Semaglutide GLP-1 | Valeo Health",
        seoTitleAr: "سيماغلوتيد GLP-1 | فاليو هيلث",
        seoDescriptionEn: "Prescription GLP-1 weight management medication. Doctor consultation required.",
        seoDescriptionAr: "دواء إدارة الوزن GLP-1 بوصفة طبية. استشارة الطبيب مطلوبة.",

        hideVariantsOnConsultationLink: true,
        forceVariantDisplay: false,
        variantVisibilityUrlOverrideEnabled: false,
        subscriptionAutoSelectOverride: false,
        showCompareAtPrice: false,
        showStockIndicator: false,
        showDeliveryEstimate: true,
        consultationLinkSuppressesAddons: true,

        faq: [],

        reviews: [
            { id: "r6", reviewerName: "Dr. Khalid M.", rating: 5, reviewTextEn: "Under medical supervision, Semaglutide through Valeo has been a game changer for my patients.", isVerified: true, sortOrder: 0 }
        ],
        influencerVideos: [],
        superiorityBlock: {
            headlineEn: "Why Semaglutide via Valeo Health",
            headlineAr: "لماذا سيماغلوتيد عبر فاليو هيلث",
            mediaType: null, mediaUrl: "", thumbnailUrl: "",
            points: [
                { titleEn: "Prescription-Grade, Doctor Supervised", titleAr: "بوصفة طبية وإشراف طبي", descriptionEn: "Every prescription is reviewed and approved by a licensed physician before dispensing.", descriptionAr: "كل وصفة طبية يتم مراجعتها والموافقة عليها من قبل طبيب مرخص." },
                { titleEn: "Cold-Chain Delivery", titleAr: "توصيل بسلسلة التبريد", descriptionEn: "Temperature-controlled dispatch from our MOH-licensed pharmacy to your door.", descriptionAr: "شحن بدرجة حرارة محكومة من صيدليتنا المرخصة." }
            ]
        },

        variants: [
            {
                id: "v5",
                slugEn: "semaglutide-025mg",
                slugAr: "semaglutide-025mg-ar",
                nameEn: "0.25mg / 0.5ml",
                nameAr: "0.25 مجم / 0.5 مل",
                variantType: "dosage",
                variantLabelEn: "0.25mg",
                variantLabelAr: "0.25 مجم",
                vat: 5,
                isDefault: true,
                sortOrder: 0,
                status: "active",
                stockQuantity: 30,
                customFields: { concentration: "0.25mg/0.5ml", pens_per_pack: "4" },
                regionalData: [
                    { country: "UAE", sku: "SEM-UAE-025", zohoId: "ZH-UAE-3001", price: 850, isAvailable: true }
                ]
            },
            {
                id: "v6",
                slugEn: "semaglutide-05mg",
                slugAr: "semaglutide-05mg-ar",
                nameEn: "0.5mg / 0.5ml",
                nameAr: "0.5 مجم / 0.5 مل",
                variantType: "dosage",
                variantLabelEn: "0.5mg",
                variantLabelAr: "0.5 مجم",
                vat: 5,
                isDefault: false,
                sortOrder: 1,
                status: "active",
                stockQuantity: 22,
                customFields: { concentration: "0.5mg/0.5ml", pens_per_pack: "4" },
                regionalData: [
                    { country: "UAE", sku: "SEM-UAE-050", zohoId: "ZH-UAE-3002", price: 1100, isAvailable: true }
                ]
            }
        ]
    },
    {
        id: "p4",
        internalName: "oura-ring-gen4",
        displayNameEn: "Oura Ring Gen 4",
        displayNameAr: "خاتم أورا الجيل الرابع",
        type: "wearable",
        subCategory: "Smart Ring",
        category: "Wearables",
        brand: "Oura",
        status: "active",
        visibility: "public",
        slugEn: "oura-ring-gen4",
        slugAr: "oura-ring-gen4-ar",
        createdAt: "2024-03-01T09:00:00Z",
        updatedAt: "2024-03-14T10:00:00Z",

        isPrescriptionRequired: false,
        isOtc: false,
        requiresConsultation: false,
        isControlledSubstance: false,
        regulatoryBadges: [],

        wearableManufacturer: "Oura Health Oy",
        wearableConnectivity: "Bluetooth 5.3",
        wearableCompatibility: "iOS 16+, Android 11+",
        wearableWarrantyMonths: 24,
        wearableSpecs: {
            "Battery Life": "Up to 8 days",
            "Water Resistance": "100m",
            "Sensors": "Heart Rate, SpO2, Skin Temp, HRV, Accelerometer"
        },

        descriptionEn: "The Oura Ring Gen 4 is the most advanced sleep and health tracker. Tracks sleep stages, HRV, readiness, and more.",
        descriptionAr: "خاتم أورا الجيل الرابع هو أكثر أجهزة تتبع النوم والصحة تقدماً.",
        shortDescriptionEn: "Advanced sleep and health tracking in a titanium ring.",
        shortDescriptionAr: "تتبع النوم والصحة المتقدم في خاتم من التيتانيوم.",
        benefits: [],
        ingredients: [],
        trustBadges: [],
        mediaGallery: [
            { assetId: "m4", type: "image", url: "", altTextEn: "Oura Ring Gen 4", altTextAr: "خاتم أورا الجيل الرابع", sortOrder: 0, isHero: true }
        ],
        deliveryConfig: [
            { city: "Dubai", deliveryTime: "3-5 days", isAvailable: true }
        ],

        subscriptionEnabled: false,
        subscriptionAutoSelected: false,
        subscriptionFrequencies: [],
        subscriptionDiscountPct: {},
        subscriptionMinCycles: 1,
        multiBuyTiers: [],
        bundles: [],

        enhancements: [],
        frequentlyBoughtTogether: [],
        biomarkerPackages: [],
        consultationAddonEnabled: false,
        consultationAddonPrice: 0,
        giftWrappingEnabled: true,
        giftWrappingPrice: 25,
        extendedDeliveryEnabled: false,

        seoTitleEn: "Oura Ring Gen 4 | Smart Health Ring | Valeo",
        seoTitleAr: "خاتم أورا الجيل الرابع | خاتم صحي ذكي | فاليو",
        seoDescriptionEn: "Track sleep, HRV, and readiness with the most advanced health ring.",
        seoDescriptionAr: "تتبع النوم ومعدل ضربات القلب والجاهزية بأكثر خاتم صحي تقدماً.",

        hideVariantsOnConsultationLink: false,
        forceVariantDisplay: true,
        variantVisibilityUrlOverrideEnabled: true,
        subscriptionAutoSelectOverride: null,
        showCompareAtPrice: true,
        showStockIndicator: true,
        showDeliveryEstimate: true,
        consultationLinkSuppressesAddons: false,

        faq: [],

        reviews: [
            { id: "r7", reviewerName: "Mark Fontaine", rating: 5, reviewTextEn: "The best sleep tracker on the market. 8 days battery life is no joke.", isVerified: true, sortOrder: 0 },
            { id: "r8", reviewerName: "Priya Sharma", rating: 5, reviewTextEn: "My HRV scores finally make sense. The readiness score has changed how I train.", isVerified: true, photoUrl: "", sortOrder: 1 }
        ],
        influencerVideos: [
            { id: "iv4", handle: "@biohackerdubai", platform: "youtube", videoUrl: "", thumbnailUrl: "", captionEn: "Oura Ring Gen 4 — 6 month honest review", sortOrder: 0 },
            { id: "iv5", handle: "@sleepwithnoor", platform: "instagram", videoUrl: "", thumbnailUrl: "", captionEn: "How I fixed my sleep using Oura Ring data", sortOrder: 1 }
        ],
        superiorityBlock: {
            headlineEn: "Why the Oura Ring Gen 4 Leads the Category",
            headlineAr: "لماذا خاتم أورا الجيل الرابع يقود الفئة",
            mediaType: null, mediaUrl: "", thumbnailUrl: "",
            points: [
                { titleEn: "Clinically Validated Sensors", titleAr: "أجهزة استشعار معتمدة سريرياً", descriptionEn: "Heart rate, HRV, SpO2, skin temperature and sleep staging validated against clinical-grade equipment.", descriptionAr: "تم التحقق من صحة معدل ضربات القلب ومتغير معدل ضربات القلب وSpO2 ودرجة حرارة الجلد." },
                { titleEn: "8-Day Battery Life", titleAr: "عمر بطارية 8 أيام", descriptionEn: "The longest battery life of any leading smart ring on the market.", descriptionAr: "أطول عمر بطارية لأي خاتم ذكي رائد في السوق." },
                { titleEn: "100m Water Resistance", titleAr: "مقاومة للماء حتى 100 متر", descriptionEn: "Swim, shower, and dive with total confidence.", descriptionAr: "سباحة ودش وغطس بكل ثقة." },
                { titleEn: "Readiness Score", titleAr: "درجة الاستعداد", descriptionEn: "A single daily score synthesising sleep, HRV, body temp and activity to guide your day.", descriptionAr: "درجة يومية واحدة تجمع النوم ومتغير معدل ضربات القلب ودرجة الجسم والنشاط." }
            ]
        },

        variantOptions: [
            // Wearables are the canonical two-axis case. Before this existed, the three
            // variants below crammed the combination into a single label ("6 / Silver")
            // and hid colour in customFields — colour was unrepresentable.
            {
                id: "opt-oura-colour", kind: "colour", nameEn: "Colour", nameAr: "اللون", position: 0,
                values: [
                    { id: "ov-silver", valueEn: "Silver", valueAr: "فضي", swatchHex: "#C0C4CC", position: 0, isActive: true },
                    { id: "ov-black", valueEn: "Midnight Black", valueAr: "أسود", swatchHex: "#1A1A1A", position: 1, isActive: true },
                    { id: "ov-gold", valueEn: "Gold", valueAr: "ذهبي", swatchHex: "#C9A227", position: 2, isActive: true },
                ],
            },
            {
                id: "opt-oura-size", kind: "size", nameEn: "Size", nameAr: "المقاس", position: 1,
                values: [
                    { id: "ov-s6", valueEn: "6", valueAr: "6", position: 0, isActive: true },
                    { id: "ov-s7", valueEn: "7", valueAr: "7", position: 1, isActive: true },
                    { id: "ov-s9", valueEn: "9", valueAr: "9", position: 2, isActive: true },
                ],
            },
        ],
        variants: [
            {
                id: "v7",
                optionValues: { "opt-oura-colour": "ov-silver", "opt-oura-size": "ov-s6" },
                slugEn: "oura-ring-gen4-size6-silver",
                slugAr: "oura-ring-gen4-size6-silver-ar",
                nameEn: "Size 6 — Silver",
                nameAr: "مقاس 6 — فضي",
                variantType: "size",
                variantLabelEn: "6 / Silver",
                variantLabelAr: "6 / فضي",
                vat: 5,
                isDefault: false,
                sortOrder: 0,
                status: "active",
                stockQuantity: 5,
                lowStockThreshold: 5,
                customFields: { ring_size: "6", colour: "Silver" },
                regionalData: [
                    { country: "UAE", sku: "OUR-UAE-S6-SLV", zohoId: "ZH-UAE-4001", price: 1450, isAvailable: true }
                ]
            },
            {
                id: "v8",
                optionValues: { "opt-oura-colour": "ov-black", "opt-oura-size": "ov-s7" },
                slugEn: "oura-ring-gen4-size7-black",
                slugAr: "oura-ring-gen4-size7-black-ar",
                nameEn: "Size 7 — Stealth Black",
                nameAr: "مقاس 7 — أسود مخفي",
                variantType: "size",
                variantLabelEn: "7 / Black",
                variantLabelAr: "7 / أسود",
                vat: 5,
                isDefault: true,
                sortOrder: 1,
                status: "active",
                stockQuantity: 12,
                customFields: { ring_size: "7", colour: "Stealth Black" },
                regionalData: [
                    { country: "UAE", sku: "OUR-UAE-S7-BLK", zohoId: "ZH-UAE-4002", price: 1450, isAvailable: true }
                ]
            },
            {
                id: "v9",
                optionValues: { "opt-oura-colour": "ov-gold", "opt-oura-size": "ov-s9" },
                slugEn: "oura-ring-gen4-size9-gold",
                slugAr: "oura-ring-gen4-size9-gold-ar",
                nameEn: "Size 9 — Gold",
                nameAr: "مقاس 9 — ذهبي",
                variantType: "size",
                variantLabelEn: "9 / Gold",
                variantLabelAr: "9 / ذهبي",
                vat: 5,
                isDefault: false,
                sortOrder: 2,
                status: "out_of_stock",
                stockQuantity: 0,
                customFields: { ring_size: "9", colour: "Gold" },
                regionalData: [
                    { country: "UAE", sku: "OUR-UAE-S9-GLD", zohoId: "ZH-UAE-4003", price: 1450, isAvailable: false }
                ]
            }
        ]
    },
    {
        id: "p5",
        internalName: "valeo-gift-card",
        displayNameEn: "Valeo Gift Card",
        displayNameAr: "بطاقة هدية فاليو",
        type: "gift_card",
        category: "Gift Cards",
        status: "draft",
        visibility: "hidden",
        slugEn: "valeo-gift-card",
        slugAr: "valeo-gift-card-ar",
        createdAt: "2024-03-10T09:00:00Z",
        updatedAt: "2024-03-10T09:00:00Z",

        isPrescriptionRequired: false,
        isOtc: false,
        requiresConsultation: false,
        isControlledSubstance: false,
        regulatoryBadges: [],

        giftCardValidity: "12 Months",
        giftCardRedemptionType: "digital",
        giftCardTermsEn: "Valid for 12 months from date of purchase. Redeemable on all Valeo services.",
        giftCardTermsAr: "صالحة لمدة 12 شهراً من تاريخ الشراء. قابلة للاسترداد على جميع خدمات فاليو.",
        giftCardRedemptionScope: ["Lab Tests", "Supplements", "Consultations"],

        descriptionEn: "Give the gift of health. Redeemable across all Valeo products and services.",
        descriptionAr: "أهدِ صحة أفضل. قابل للاسترداد على جميع منتجات وخدمات فاليو.",
        shortDescriptionEn: "The perfect health gift for your loved ones.",
        shortDescriptionAr: "الهدية الصحية المثالية لأحبائك.",
        benefits: [],
        ingredients: [],
        trustBadges: [],
        mediaGallery: [],
        deliveryConfig: [],

        subscriptionEnabled: false,
        subscriptionAutoSelected: false,
        subscriptionFrequencies: [],
        subscriptionDiscountPct: {},
        subscriptionMinCycles: 1,
        multiBuyTiers: [],
        bundles: [],

        enhancements: [],
        frequentlyBoughtTogether: [],
        biomarkerPackages: [],
        consultationAddonEnabled: false,
        consultationAddonPrice: 0,
        giftWrappingEnabled: false,
        giftWrappingPrice: 0,
        extendedDeliveryEnabled: false,

        seoTitleEn: "Valeo Health Gift Card",
        seoTitleAr: "بطاقة هدية فاليو هيلث",
        seoDescriptionEn: "Give the gift of health with a Valeo Gift Card.",
        seoDescriptionAr: "أهدِ صحة أفضل مع بطاقة هدية فاليو.",

        hideVariantsOnConsultationLink: false,
        forceVariantDisplay: false,
        variantVisibilityUrlOverrideEnabled: true,
        subscriptionAutoSelectOverride: null,
        showCompareAtPrice: false,
        showStockIndicator: false,
        showDeliveryEstimate: false,
        consultationLinkSuppressesAddons: false,

        faq: [],

        reviews: [],
        influencerVideos: [],
        superiorityBlock: {
            headlineEn: "Why a Valeo Gift Card is the Thoughtful Health Gift",
            headlineAr: "لماذا بطاقة هدية فاليو هي الهدية الصحية المدروسة",
            mediaType: null, mediaUrl: "", thumbnailUrl: "",
            points: []
        },

        variants: [
            {
                id: "v10",
                slugEn: "valeo-gift-card-aed250",
                slugAr: "valeo-gift-card-aed250-ar",
                nameEn: "AED 250",
                nameAr: "250 درهم",
                variantType: "denomination",
                variantLabelEn: "AED 250",
                variantLabelAr: "250 درهم",
                vat: 0,
                isDefault: true,
                sortOrder: 0,
                status: "inactive",
                stockQuantity: 999,
                customFields: {},
                regionalData: [
                    { country: "UAE", sku: "GC-UAE-250", zohoId: "", price: 250, isAvailable: false }
                ]
            }
        ]
    }
]

// ── Catalogue listing store ───────────────────────────────────
// A module-level mutable store so incremental "save & continue" writes
// actually persist across navigation (the prototype's stand-in for a DB).
// Seeded lazily on first read from the literal + migrated masters.
let LISTINGS_STORE: Listing[] | null = null
let LISTING_SEQ = 0
// D-C53: `product_master` ids start at 10001, and the uid is
// `{departments.code}-{product_id}`. Mirrored here so a minted draft carries a
// realistic internal code rather than a fabricated-looking one.
let PRODUCT_ID_SEQ = 10000
const cloneListing = (l: Listing): Listing => JSON.parse(JSON.stringify(l))

// ── Retention template store ──────────────────────────────────
// Mutable module-level store (mirrors LISTINGS_STORE) so builder edits persist
// across navigation. Seeded lazily with one "WeightLoss Retention" template
// (19 ranked sections) plus an empty "Blank Retention" template.
let RETENTION_STORE: RetentionTemplate[] | null = null
const cloneTemplate = (t: RetentionTemplate): RetentionTemplate => JSON.parse(JSON.stringify(t))

function seedRetentionTemplates(): RetentionTemplate[] {
    const s = (
        rank: number,
        type: RetentionSection["type"],
        titleEn: string,
        opts: Partial<RetentionSection> = {},
    ): RetentionSection => ({
        id: `rs-${rank}`, rank, type, titleEn, enabled: true, ...opts,
    })
    // 16 weekly doctor messages across the 4-month journey (Figma content plan:
    // M1 initiation/dosing/side-effects/expectations · M2 adherence/nutrition/activity
    // · M3 plateau/dose-adjustments · M4 maintenance/tapering/long-term habits).
    const DOCTOR_MSGS = ([
        ["Welcome to your journey", "You've taken the first step — here's what the next 4 months look like and how we'll support you."],
        ["Understanding your first dose", "How to take your first dose correctly, when to expect effects, and what's normal."],
        ["Managing early side effects", "Mild nausea or fatigue can happen early. Here's how to ease it and when to call us."],
        ["Setting realistic expectations", "Weight comes off gradually and safely. Here's the pace to expect and why it matters."],
        ["Staying consistent with your dose", "Consistency drives results. Tips to never miss your weekly dose."],
        ["Nutrition that supports your progress", "Simple, protein-forward eating that works with your medication."],
        ["Building gentle activity habits", "Small movement goals that compound — no gym required."],
        ["Your first month — progress check", "Let's review how month one went and adjust anything that needs it."],
        ["Navigating a plateau", "Plateaus are normal. Here's what's happening and how we respond."],
        ["When and why doses are adjusted", "How your care team decides on titration, and what to watch for."],
        ["Hydration & protein reminders", "Two habits that protect your energy and muscle as you lose weight."],
        ["Three months in — celebrate wins", "Look how far you've come. A quick reflection and what's next."],
        ["Maintaining your results", "Shifting from loss to maintenance — the mindset and the plan."],
        ["Understanding tapering", "If and when you taper, here's how we do it safely."],
        ["Long-term habits that stick", "The routines that keep the results after the program."],
        ["Graduating your program", "What ongoing support looks like and how to stay connected."],
    ] as const).map((m, i): RetentionMessage => ({
        id: `msg-wl-${i + 1}`, week: i + 1, titleEn: `Week ${i + 1}: ${m[0]}`, bodyEn: m[1], status: "published",
    }))
    return [
        {
            id: "rt-weightloss",
            name: "WeightLoss Retention",
            descriptionEn: "Ranked retention page for the medically-guided weight-loss journey.",
            sections: [
                s(1, "banner", "Banner Upload", { descriptionEn: "Hero banner to personalize retention page by cohort/country" }),
                s(2, "package", "Free Coach Consultation Package", { itemCount: 1, descriptionEn: "Complimentary coaching session offered to retain the patient." }),
                s(3, "messages", "Weekly Doctor Messages", { itemCount: 16, descriptionEn: "Automated nudges from care team", config: { messages: DOCTOR_MSGS } }),
                s(4, "video", "Video Upload (Medicine-focused)", { itemCount: 16, descriptionEn: "Educational medicine-focused videos surfaced weekly." }),
                s(5, "package", "Nutritionist Package", { descriptionEn: "Add-on nutritionist package for the journey." }),
                s(6, "content", "Top Picks for your Journey", { itemCount: 12, descriptionEn: "Curated listings recommended for this journey." }),
                s(7, "content", "Support Beyond Medication", { itemCount: 4, descriptionEn: "Complementary services beyond the core medication." }),
                s(8, "content", "Recommended Tests For you", { itemCount: 6, descriptionEn: "Follow-up lab tests recommended for this journey." }),
                s(9, "content", "Educational Content", { itemCount: 24, descriptionEn: "Articles and guides that keep patients engaged." }),
                s(10, "symptoms", "Clinical Reference Lists", { descriptionEn: "Symptoms, stop reasons, GLP-1 decline, ineligibility" }),
                s(11, "onboarding", "Onboarding", { descriptionEn: "Program benefits and why patients need this" }),
                s(12, "nextdose", "Next Dose", { descriptionEn: "Deep links to next dose for each medication" }),
                s(13, "simpletitle", "NEXT_DOSE", { config: { sectionKey: "NEXT_DOSE" } }),
                s(14, "simpletitle", "PRESCRIPTION_SUMMARY", { config: { sectionKey: "PRESCRIPTION_SUMMARY" } }),
                s(15, "simpletitle", "DOCTOR_NOTE", { config: { sectionKey: "DOCTOR_NOTE" } }),
                s(16, "simpletitle", "WEIGHT_PROGRESS", { config: { sectionKey: "WEIGHT_PROGRESS" } }),
                s(17, "simpletitle", "ONGOING_MEDICINE", { config: { sectionKey: "ONGOING_MEDICINE" } }),
                s(18, "simpletitle", "NEXT_GOAL", { config: { sectionKey: "NEXT_GOAL" } }),
                s(19, "simpletitle", "WEARABLE_DATA", { config: { sectionKey: "WEARABLE_DATA" } }),
            ],
        },
        {
            id: "rt-blank",
            name: "Blank Retention",
            descriptionEn: "An empty retention page to build from scratch.",
            sections: [],
        },
    ]
}

// ── Promo banner store ────────────────────────────────────────
// Mutable module-level store (mirrors LISTINGS_STORE / RETENTION_STORE) so
// edits persist across navigation. Seeded lazily with a few reusable banners.
// ── Diagnostics masters ───────────────────────────────────────────────────────
// The biomarker master lives in the Admin Portal (`tests_tests`) — the CMS only
// maps them onto packages. legacyId values below are the real marker ids seen in
// BLOOD_DRIFT; the display names are sample data, because that workbook could not
// resolve names ("Marker name (needs tests_tests)" was empty for every row).
let BIOMARKERS_STORE: Biomarker[] | null = null
function seedBiomarkers(): Biomarker[] {
    const mk = (legacyId: number, nameEn: string, panelGroup: string,
                sampleKind: SampleKind = "blood"): Biomarker =>
        ({ id: `bm-${legacyId}`, legacyId, nameEn, panelGroup, sampleKind, isActive: true })
    return [
        mk(1, "Haemoglobin", "Complete Blood Count"),
        mk(2, "White Blood Cell Count", "Complete Blood Count"),
        mk(3, "Platelet Count", "Complete Blood Count"),
        mk(4, "Haematocrit", "Complete Blood Count"),
        mk(5, "Red Cell Distribution Width", "Complete Blood Count"),
        mk(7, "Mean Corpuscular Volume", "Complete Blood Count"),
        mk(11, "Total Cholesterol", "Lipid Profile"),
        mk(12, "LDL Cholesterol", "Lipid Profile"),
        mk(13, "HDL Cholesterol", "Lipid Profile"),
        mk(14, "Triglycerides", "Lipid Profile"),
        mk(21, "Fasting Glucose", "Metabolic"),
        mk(22, "HbA1c", "Metabolic"),
        mk(23, "Fasting Insulin", "Metabolic"),
        mk(24, "HOMA-IR", "Metabolic"),
        mk(31, "TSH", "Thyroid"),
        mk(32, "Free T4", "Thyroid"),
        mk(33, "Free T3", "Thyroid"),
        mk(35, "Thyroid Peroxidase Antibodies", "Thyroid"),
        mk(41, "Vitamin D (25-OH)", "Vitamins & Minerals"),
        mk(42, "Vitamin B12", "Vitamins & Minerals"),
        mk(44, "Folate", "Vitamins & Minerals"),
        mk(45, "Ferritin", "Vitamins & Minerals"),
        mk(46, "Serum Iron", "Vitamins & Minerals"),
        mk(47, "Magnesium", "Vitamins & Minerals"),
        mk(51, "ALT", "Liver"),
        mk(52, "AST", "Liver"),
        mk(53, "GGT", "Liver"),
        mk(57, "Albumin", "Liver"),
        mk(60, "Creatinine", "Kidney"),
        mk(61, "eGFR", "Kidney"),
        mk(62, "Urea", "Kidney"),
        mk(70, "Testosterone (Total)", "Hormones"),
        mk(71, "Free Testosterone", "Hormones"),
        mk(72, "Oestradiol", "Hormones"),
        mk(73, "Cortisol", "Hormones"),
        mk(74, "DHEA-S", "Hormones"),
        mk(81, "hs-CRP", "Inflammation"),
        mk(82, "Homocysteine", "Inflammation"),
        mk(146, "Neutrophils", "Differential"),
        mk(147, "Lymphocytes", "Differential"),
        mk(148, "Monocytes", "Differential"),
        mk(149, "Eosinophils", "Differential"),
        mk(150, "Basophils", "Differential"),
        mk(157, "Apolipoprotein B", "Advanced Cardiac"),
        mk(169, "Lipoprotein(a)", "Advanced Cardiac"),
        // non-blood markers — Non-Blood Sample Test packages map these
        mk(201, "Urine Protein", "Urinalysis", "urine"),
        mk(202, "Urine Microalbumin", "Urinalysis", "urine"),
        mk(211, "Faecal Calprotectin", "Stool", "stool"),
        mk(212, "Faecal Occult Blood", "Stool", "stool"),
        mk(221, "Salivary Cortisol (waking)", "Saliva", "saliva"),
        mk(231, "H. pylori Breath", "Breath", "breath"),
    ].map(applyClinical)
}

let LABS_STORE: DiagnosticsLab[] | null = null
let RANGES_STORE: BiomarkerRange[] | null = null
let LAB_MAPPINGS_STORE: BiomarkerLabMapping[] | null = null
let CYOT_CONFIG_STORE: CyotConfig[] | null = null
let BM_SEQ = 0
function seedLabs(): DiagnosticsLab[] {
    return [
        { id: "lab-uae-valeo", nameEn: "Valeo Lab — Dubai", country: "UAE", isActive: true },
        { id: "lab-uae-partner", nameEn: "Unilabs Dubai", country: "UAE", isActive: true },
        { id: "lab-ksa-valeo", nameEn: "Valeo Lab — Riyadh", country: "KSA", isActive: true },
        { id: "lab-ksa-partner", nameEn: "Al Borg Riyadh", country: "KSA", isActive: true },
        { id: "lab-qat-partner", nameEn: "Doha Reference Lab", country: "QATAR", isActive: true },
    ]
}

// ── Biomarker model seeds ─────────────────────────────────────
// Panels now come from Postgres, so the derivation that built them from the
// legacy free-text `panelGroup` is gone with them.


const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

/**
 * Reference bands. Deliberately uneven, because the real data is: most analytes
 * have none, a few have a full graded scale, one (Vitamin D) carries a CLOSED
 * historical generation so the effective-dating is visible rather than claimed.
 */
function seedRanges(): BiomarkerRange[] {
    let n = 0
    const mk = (
        biomarkerId: string, grade: RangeGrade, low: number | undefined, high: number | undefined,
        extra: Partial<BiomarkerRange> = {},
    ): BiomarkerRange => ({
        id: `rng-${++n}`, biomarkerId, sex: "any", grade, low, high,
        effectiveFrom: "2026-01-01", ...extra,
    })
    return [
        // Vitamin D — the current generation
        mk("bm-41", "critical_low", undefined, 10, { labelEn: "Severe deficiency" }),
        mk("bm-41", "low", 10, 20, { labelEn: "Deficiency" }),
        mk("bm-41", "suboptimal", 20, 30, { labelEn: "Insufficiency" }),
        mk("bm-41", "normal", 30, 50, { labelEn: "Adequate" }),
        mk("bm-41", "optimal", 50, 80, { labelEn: "Optimal" }),
        mk("bm-41", "high", 80, 100, { labelEn: "High" }),
        mk("bm-41", "critical_high", 100, undefined, { labelEn: "Toxicity risk" }),
        // Vitamin D — the CLOSED previous generation. Kept, never deleted, so a
        // report for a sample drawn in 2025 still resolves what it said then.
        mk("bm-41", "low", 10, 30, {
            labelEn: "Deficiency (2025 scale)", effectiveFrom: "2025-01-01", effectiveTo: "2026-01-01",
        }),
        mk("bm-41", "normal", 30, 100, {
            labelEn: "Normal (2025 scale)", effectiveFrom: "2025-01-01", effectiveTo: "2026-01-01",
        }),
        // B12 — the analyte whose legacy blob held 12 overlapping bands
        mk("bm-42", "low", undefined, 200, { labelEn: "Deficiency" }),
        mk("bm-42", "suboptimal", 200, 400, { labelEn: "Borderline" }),
        mk("bm-42", "normal", 400, 700, { labelEn: "Normal" }),
        mk("bm-42", "optimal", 700, 900, { labelEn: "Optimal" }),
        mk("bm-42", "high", 900, undefined, { labelEn: "High" }),
        // HbA1c — a KSA override, to exercise the country rung
        mk("bm-22", "normal", undefined, 5.7, { labelEn: "Normal" }),
        mk("bm-22", "suboptimal", 5.7, 6.5, { labelEn: "Pre-diabetic range" }),
        mk("bm-22", "high", 6.5, undefined, { labelEn: "Diabetic range" }),
        mk("bm-22", "suboptimal", 5.6, 6.4, { country: "KSA", labelEn: "Pre-diabetic (KSA)" }),
        // TSH — sex-neutral, plus a pregnancy-scoped band
        mk("bm-31", "low", undefined, 0.4),
        mk("bm-31", "normal", 0.4, 4.0),
        mk("bm-31", "high", 4.0, undefined),
        mk("bm-31", "normal", 0.1, 2.5, { pregnancy: "pregnant", labelEn: "Normal in pregnancy" }),
        // Ferritin — sex-segregated, which the flat export lost entirely
        mk("bm-45", "low", undefined, 30, { sex: "female", labelEn: "Low" }),
        mk("bm-45", "normal", 30, 200, { sex: "female", labelEn: "Normal" }),
        mk("bm-45", "low", undefined, 40, { sex: "male", labelEn: "Low" }),
        mk("bm-45", "normal", 40, 300, { sex: "male", labelEn: "Normal" }),
    ]
}



/**
 * Lab coverage. Deliberately holed: Al Ain (city-15) has no vitamin coverage,
 * so a basket priced there is blocked at selection rather than at fulfilment —
 * which is the whole reason these rows carry cities.
 */
function seedLabMappings(): BiomarkerLabMapping[] {
    if (!BIOMARKERS_STORE) BIOMARKERS_STORE = seedBiomarkers()
    let n = 0
    const mk = (
        biomarkerId: string, labId: string, country: Country, extra: Partial<BiomarkerLabMapping> = {},
    ): BiomarkerLabMapping => ({
        id: `blm-${++n}`, biomarkerId, labId, country, isActive: true,
        labTestCode: `${labId.split("-").pop()!.toUpperCase()}-${biomarkerId.replace("bm-", "")}`,
        ...extra,
    })
    const bloodUae = BIOMARKERS_STORE.filter(b => b.sampleKind === "blood").map(b => b.id)
    return [
        // The Dubai lab runs the whole blood menu, everywhere in the UAE.
        ...bloodUae.map(id => mk(id, "lab-uae-valeo", "UAE", { b2bCost: 22, tatHours: 24 })),
        // Unilabs covers a narrower menu but only in Dubai and Abu Dhabi.
        ...["bm-41", "bm-42", "bm-22", "bm-31"].map(id =>
            mk(id, "lab-uae-partner", "UAE", {
                cityIds: ["city-1", "city-2"], b2bCost: 18, tatHours: 48,
                prescriptionRequired: id === "bm-70",
            })),
        // Riyadh, blood only, with consent required on hormones.
        ...["bm-41", "bm-42", "bm-22", "bm-31", "bm-11", "bm-12", "bm-13", "bm-14"].map(id =>
            mk(id, "lab-ksa-valeo", "KSA", { b2bCost: 26, tatHours: 36 })),
        mk("bm-70", "lab-ksa-valeo", "KSA", { b2bCost: 60, consentRequired: true }),
    ]
}

function seedCyotConfig(): CyotConfig[] {
    return [
        { country: "UAE", minSelections: 3, maxSelections: 25, assemblyFee: 50, isActive: true },
        { country: "KSA", minSelections: 3, maxSelections: 20, isActive: true },
    ]
}

/**
 * The clinical detail the legacy master had nowhere to put. Sparse on purpose:
 * most of the 100+ rows carry only what the old screen could hold, so the
 * authoring gaps are real and visible rather than a demo where everything is
 * already complete.
 *
 * `bm-24` (HOMA-IR) and `bm-61` (eGFR) are marked DERIVED with their inputs —
 * they were always computed, and nothing in the old model could say so.
 */
const CLINICAL: Record<string, Partial<Biomarker>> = {
    "bm-41": { internalName: "vitamin_d_25oh", unitUcum: "ng/mL", tubeType: "sst_gold",
        fastingHours: undefined, tatHours: 24, lifecycle: "active",
        analyticalMethod: "CLIA", countryAvailability: ["UAE", "KSA"],
        descriptionEn: "25-hydroxyvitamin D, the storage form and the standard measure of vitamin D status.",
        descriptionAr: "فيتامين د ٢٥-هيدروكسي", causesEn: "Low sun exposure, malabsorption, obesity.",
        whatToDoEn: "Supplement per the deficiency band and retest in 12 weeks." },
    "bm-42": { internalName: "vitamin_b12", unitUcum: "pg/mL", tubeType: "sst_gold", tatHours: 24,
        lifecycle: "active", countryAvailability: ["UAE", "KSA"],
        descriptionEn: "Cobalamin. Required for red cell formation and neurological function.",
        descriptionAr: "فيتامين ب١٢" },
    "bm-22": { internalName: "hba1c", unitUcum: "%", tubeType: "edta_lavender", tatHours: 24,
        lifecycle: "active", countryAvailability: ["UAE", "KSA", "QATAR"],
        descriptionEn: "Average glycaemia over roughly three months.",
        descriptionAr: "الهيموغلوبين السكري" },
    "bm-21": { internalName: "fasting_glucose", unitUcum: "mmol/L", tubeType: "fluoride_grey",
        fastingHours: 8, tatHours: 12, lifecycle: "active", countryAvailability: ["UAE", "KSA"],
        descriptionEn: "Plasma glucose after an overnight fast." },
    "bm-23": { internalName: "fasting_insulin", unitUcum: "mIU/L", tubeType: "sst_gold",
        fastingHours: 8, tatHours: 48, lifecycle: "active", countryAvailability: ["UAE"],
        descriptionEn: "Fasting insulin, paired with glucose to assess insulin resistance." },
    "bm-24": { internalName: "homa_ir", unitUcum: "1", isDerived: true,
        inputIds: ["bm-21", "bm-23"], tubeType: "none", lifecycle: "active",
        countryAvailability: ["UAE"],
        descriptionEn: "Insulin resistance index, calculated from fasting glucose and fasting insulin. Never drawn." },
    "bm-61": { internalName: "egfr", unitUcum: "mL/min/{1.73_m2}", isDerived: true,
        inputIds: ["bm-60"], tubeType: "none", lifecycle: "active", countryAvailability: ["UAE", "KSA"],
        descriptionEn: "Estimated glomerular filtration rate, calculated from creatinine, age and sex." },
    "bm-60": { internalName: "creatinine", unitUcum: "umol/L", tubeType: "sst_gold", tatHours: 12,
        lifecycle: "active", countryAvailability: ["UAE", "KSA"] },
    "bm-31": { internalName: "tsh", unitUcum: "mIU/L", tubeType: "sst_gold", tatHours: 24,
        lifecycle: "active", countryAvailability: ["UAE", "KSA"],
        descriptionEn: "Thyroid stimulating hormone." },
    "bm-45": { internalName: "ferritin", unitUcum: "ng/mL", tubeType: "sst_gold", tatHours: 24,
        lifecycle: "active", countryAvailability: ["UAE", "KSA"],
        descriptionEn: "Iron storage protein and the earliest marker of iron deficiency." },
    // A hard sex restriction, which the legacy master could not express at all.
    "bm-70": { internalName: "testosterone_total", unitUcum: "nmol/L", tubeType: "sst_gold",
        tatHours: 48, sexApplicability: "male_only", lifecycle: "active",
        countryAvailability: ["UAE", "KSA"],
        descriptionEn: "Total testosterone." },
    "bm-72": { internalName: "oestradiol", unitUcum: "pmol/L", tubeType: "sst_gold",
        sexApplicability: "female_only", lifecycle: "active", countryAvailability: ["UAE"] },
    "bm-11": { internalName: "total_cholesterol", unitUcum: "mmol/L", tubeType: "sst_gold",
        fastingHours: 9, lifecycle: "active", countryAvailability: ["UAE", "KSA"] },
    "bm-12": { internalName: "ldl_cholesterol", unitUcum: "mmol/L", tubeType: "sst_gold",
        fastingHours: 9, lifecycle: "active", countryAvailability: ["UAE", "KSA"] },
    "bm-13": { internalName: "hdl_cholesterol", unitUcum: "mmol/L", tubeType: "sst_gold",
        fastingHours: 9, lifecycle: "active", countryAvailability: ["UAE", "KSA"] },
    "bm-14": { internalName: "triglycerides", unitUcum: "mmol/L", tubeType: "sst_gold",
        fastingHours: 9, lifecycle: "active", countryAvailability: ["UAE", "KSA"] },
    "bm-1": { internalName: "haemoglobin", unitUcum: "g/dL", tubeType: "edta_lavender",
        lifecycle: "active", countryAvailability: ["UAE", "KSA"] },
    "bm-2": { internalName: "wbc", unitUcum: "10*9/L", tubeType: "edta_lavender",
        lifecycle: "active", countryAvailability: ["UAE", "KSA"] },
    "bm-3": { internalName: "platelet_count", unitUcum: "10*9/L", tubeType: "edta_lavender",
        lifecycle: "active", countryAvailability: ["UAE", "KSA"] },
    "bm-81": { internalName: "hs_crp", unitUcum: "mg/L", tubeType: "sst_gold",
        lifecycle: "active", countryAvailability: ["UAE"] },
    "bm-201": { internalName: "urine_protein", unitUcum: "mg/dL", lifecycle: "active",
        countryAvailability: ["UAE"] },
}

const applyClinical = (b: Biomarker): Biomarker => ({ ...b, ...(CLINICAL[b.id] ?? {}) })

// Slot groups are CITY-scoped in the Order Service (api/v1/slots/groups?cityId=),
// which is why a real group id can only be pinned on a city row.
let SLOT_GROUPS_STORE: SlotGroup[] | null = null
function seedSlotGroups(): SlotGroup[] {
    return [
        { groupId: "sg-dxb-morning", groupName: "Dubai · Morning (6–11)", cityId: "city-1", leadTimeMinutes: 120, isActive: true },
        { groupId: "sg-dxb-evening", groupName: "Dubai · Evening (17–21)", cityId: "city-1", leadTimeMinutes: 180, isActive: true },
        { groupId: "sg-auh-morning", groupName: "Abu Dhabi · Morning (6–11)", cityId: "city-2", leadTimeMinutes: 180, isActive: true },
        { groupId: "sg-shj-morning", groupName: "Sharjah · Morning (6–11)", cityId: "city-3", leadTimeMinutes: 240, isActive: true },
        { groupId: "sg-ruh-morning", groupName: "Riyadh · Morning (6–11)", cityId: "city-4", leadTimeMinutes: 150, isActive: true },
        { groupId: "sg-ruh-evening", groupName: "Riyadh · Evening (17–21)", cityId: "city-4", leadTimeMinutes: 210, isActive: true },
        { groupId: "sg-jed-morning", groupName: "Jeddah · Morning (6–11)", cityId: "city-9", leadTimeMinutes: 240, isActive: true },
        { groupId: "sg-national-std", groupName: "National standard (all cities)", leadTimeMinutes: 240, isActive: true },
    ]
}

let COMPOSITIONS_STORE: Composition[] | null = null
let COMP_SEQ = 0
const cloneComp = (c: Composition): Composition =>
    ({
        ...c, members: c.members.map(m => ({ ...m })), rule: { ...c.rule },
        trigger: { ...c.trigger }, scopes: (c.scopes ?? []).map(s => ({ ...s })),
    })
/** Seeds demonstrate all four kinds against units that really exist in the store. */
/**
 * One row per sub-department id. Earlier entries (hand-authored) win on scalars;
 * countryConfig is merged per country so a market only one source knows about
 * survives. Nothing is dropped silently — the count is asserted in
 * .cleanup/verify-consultation.ts.
 */
function mergeSubDepartments(rows: SubDepartment[]): SubDepartment[] {
    const byId = new Map<string, SubDepartment>()
    for (const r of rows) {
        const prev = byId.get(r.id)
        if (!prev) { byId.set(r.id, { ...r, countryConfig: r.countryConfig ? [...r.countryConfig] : undefined }); continue }
        const cc = [...(prev.countryConfig ?? [])]
        for (const c of r.countryConfig ?? []) {
            if (!cc.some(x => x.country === c.country)) cc.push(c)
        }
        byId.set(r.id, { ...prev, countryConfig: cc.length ? cc : undefined })
    }
    return [...byId.values()]
}

function seedCompositions(): Composition[] {
    return [
        {
            id: "cmp-sleep-combo", kind: "combo", nameEn: "Sleep Reset Combo",
            members: [
                { id: "m1", ref: { listingId: "l-blood", kind: "service_option", unitId: "so-standard" }, quantity: 1, required: true, sortOrder: 0 },
                { id: "m2", ref: { listingId: "p1", kind: "variant", unitId: "v-d3-60" }, quantity: 1, required: true, sortOrder: 1 },
                { id: "m3", ref: { listingId: "l-iv", kind: "plan", unitId: "tp-single" }, quantity: 1, required: false, sortOrder: 2 },
            ],
            primaryMemberId: "m1",
            // spans three departments — impossible for the old BundleItem/ProductRef types.
            // In KSA its members invoice from two entities (ksa_vhit and saha), so the
            // split basis has to be DECLARED or the resolver refuses to publish it.
            rule: { kind: "bundle_price", allocation: "pro_rata_list" },
            trigger: { kind: "always" }, surface: "own_page",
            scopes: [
                // was 999 against a 993.10 member subtotal — a "combo" that cost more
                // than buying the parts, which nothing checked until the inversion gap
                { id: "sc-sleep-uae", country: "UAE", isActive: true, price: 899 },
                { id: "sc-sleep-ksa", country: "KSA", isActive: true, price: 1090 },
            ],
            status: "draft",
        },
        {
            id: "cmp-collagen-free", kind: "freebie", nameEn: "Free Marine Collagen with any IV",
            members: [
                { id: "f1", ref: { listingId: "l-iv", kind: "plan", unitId: "tp-single" }, quantity: 1, required: true, sortOrder: 0 },
                { id: "f2", ref: { listingId: "p1", kind: "variant", unitId: "v-d3-60" }, quantity: 1, required: true, sortOrder: 1 },
            ],
            rule: { kind: "grant_free", grantMemberId: "f2" },
            trigger: { kind: "attach_to", parentListingIds: ["l-iv"] }, surface: "pdp_addon",
            // the cap is a market fact, so it sits on the row, not on the composition
            scopes: [{ id: "sc-collagen-uae", country: "UAE", isActive: true, maxGrantsTotal: 500 }],
            status: "draft", maxGrantsPerOrder: 1,
        },
        {
            id: "cmp-vitd-addon", kind: "addon", nameEn: "Add Vitamin D to any blood panel",
            members: [
                { id: "a1", ref: { listingId: "l-mini-vitd", kind: "service_option", unitId: "so-standard" }, quantity: 1, required: true, sortOrder: 0 },
            ],
            rule: { kind: "member_sum" },
            // DELIBERATE, and the reason attach is a two-sided check: l-blood sets
            // excludedMiniPackageIds: ["l-mini-vitd"] because the panel already
            // measures Vit-D. The clinical veto wins, so this add-on has no eligible
            // parent and says so — rather than being served on the one panel that
            // refuses it, which is what the old one-sided filter did.
            trigger: { kind: "attach_to", parentListingIds: ["l-blood"] }, surface: "pdp_addon",
            scopes: [
                { id: "sc-vitd-uae", country: "UAE", isActive: true },
                { id: "sc-vitd-ksa", country: "KSA", isActive: true },
            ],
            status: "draft",
        },
    ]
}

let HEALTH_TEAM_STORE: Practitioner[] | null = null
const clonePr = (x: Practitioner): Practitioner => ({
    ...x, coachRoles: x.coachRoles ? x.coachRoles.map(r => ({ ...r })) : undefined,
})

/**
 * coach_role_mapping seeded ONLY where the mapping is a tautology: kind "doctor" is
 * the DOCTOR role, kind "health_coach" is the WEIGHTLOSS_COACH role. Dietitians and
 * nutritionists are left unset on purpose — whether a dietitian holds the weight-loss
 * coach role is a business decision, not something to infer from a job title, and
 * leaving it blank is what makes the Consultation gap check say so out loud.
 * No follow-up package is invented; that is finance/ops data.
 */
function seedCoachRoles(p: Practitioner): Practitioner {
    if (p.coachRoles) return p
    if (p.kind === "doctor") return { ...p, coachRoles: [{ role: "DOCTOR" }] }
    if (p.kind === "health_coach") return { ...p, coachRoles: [{ role: "WEIGHTLOSS_COACH" }] }
    return p
}

let ARTICLES_STORE: Article[] | null = null
let ARTICLE_CATS_STORE: ArticleCategory[] | null = null
let ARTICLE_SEQ = 0
const cloneArticle = (a: Article): Article => ({ ...a, categoryIds: [...a.categoryIds] })
function seedArticleCategories(): ArticleCategory[] {
    return [
        { id: "ac-nutrition", nameEn: "Nutrition", nameAr: "التغذية", slug: "nutrition", sortOrder: 0, isActive: true },
        { id: "ac-sleep", nameEn: "Sleep & Recovery", nameAr: "النوم والتعافي", slug: "sleep-recovery", sortOrder: 1, isActive: true },
        { id: "ac-hormones", nameEn: "Hormones", nameAr: "الهرمونات", slug: "hormones", sortOrder: 2, isActive: true },
        { id: "ac-weight", nameEn: "Weight Management", nameAr: "إدارة الوزن", slug: "weight-management", sortOrder: 3, isActive: true },
        { id: "ac-longevity", nameEn: "Longevity", nameAr: "طول العمر", slug: "longevity", sortOrder: 4, isActive: true },
    ]
}
function seedArticles(): Article[] {
    return [
        {
            id: "art-sleep-10", titleEn: "10 Tips for Better Sleep", titleAr: "10 نصائح لنوم أفضل",
            slug: "10-tips-for-better-sleep", categoryIds: ["ac-sleep"],
            excerptEn: "Small, evidence-backed changes that move the needle on sleep quality.",
            bodyEn: "<h2>Why sleep quality beats sleep quantity</h2><p>Eight hours of broken sleep leaves you worse off than seven unbroken ones.</p><ul><li>Keep a consistent wake time</li><li>Get light within an hour of waking</li><li>Stop caffeine 10 hours before bed</li></ul>",
            authorName: "Dr Kinza Javaid", readMinutes: 4, status: "active",
            tagIds: ["tag-goal-better-sleep"], visibleOn: "both",
            seoTitleEn: "10 Tips for Better Sleep | Valeo",
        },
        {
            id: "art-glp1-guide", titleEn: "Understanding GLP-1 medication", titleAr: "فهم أدوية GLP-1",
            slug: "understanding-glp-1-medication", categoryIds: ["ac-weight", "ac-hormones"],
            excerptEn: "What GLP-1 does, who it suits, and what to expect in the first month.",
            bodyEn: "<h2>What GLP-1 actually does</h2><p>It mimics a gut hormone that signals fullness.</p>",
            authorName: "Valeo Clinical Team", readMinutes: 6, status: "draft",
            tagIds: ["tag-goal-weight-loss"], visibleOn: "both",
        },
    ]
}

let FLASH_SALES_STORE: FlashSale[] | null = null
let FLASH_SEQ = 0
const cloneSale = (x: FlashSale): FlashSale => ({ ...x, rules: x.rules.map(r => ({ ...r })) })
function seedFlashSales(): FlashSale[] {
    // Dates are relative so the prototype always has one live and one scheduled
    // sale to look at, rather than a window that silently expired.
    const day = 86400000
    const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString()
    return [
        {
            id: "fs-ramadan", name: "Ramadan Flash — 25% off wellness",
            isDraft: false, startsAt: iso(-1), endsAt: iso(6), timezone: "Asia/Dubai",
            scopeKind: "tag", tagId: "tag-campaign-ramadan-2026",
            pricedUnit: "all", stacksWithCoupons: false,
            landingSlug: "ramadan-flash-sale",
            rules: [
                { country: "UAE", discountType: "percent", discountValue: 25, floorPrice: 49 },
                { country: "KSA", discountType: "percent", discountValue: 20, floorPrice: 55 },
            ],
            createdByName: "Catalogue Ops",
        },
        {
            id: "fs-weekend", name: "Weekend blood-test drop",
            isDraft: false, startsAt: iso(3), endsAt: iso(5), timezone: "Asia/Dubai",
            scopeKind: "listing", listingIds: ["l-blood", "l-mini-vitd"],
            pricedUnit: "service_option", stacksWithCoupons: true,
            rules: [{ country: "UAE", discountType: "fixed", discountValue: 100 }],
            createdByName: "Catalogue Ops",
        },
    ]
}

let TAGS_STORE: Tag[] | null = null
let TAG_SEQ = 0
const cloneTag = (t: Tag): Tag => ({ ...t })
/** Curated starter vocabulary — one namespace at a time, never free-typed. */
function seedTags(): Tag[] {
    const mk = (namespace: TagNamespace, slug: string, nameEn: string, nameAr: string,
                customerFacing: boolean, status: TagStatus = "active"): Tag =>
        ({ id: `tag-${namespace}-${slug}`, namespace, slug, nameEn, nameAr, status, customerFacing,
           createdByName: "Catalogue Ops" })
    return [
        mk("goal", "weight-loss", "Weight Loss", "فقدان الوزن", true),
        mk("goal", "better-sleep", "Better Sleep", "نوم أفضل", true),
        mk("goal", "energy", "Energy & Focus", "الطاقة والتركيز", true),
        mk("goal", "longevity", "Longevity", "طول العمر", true),
        mk("audience", "women", "Women", "النساء", true),
        mk("audience", "men", "Men", "الرجال", true),
        mk("audience", "over-50", "Over 50", "أكثر من 50", true),
        mk("condition", "diabetes", "Diabetes", "السكري", true),
        mk("condition", "pcos", "PCOS", "تكيس المبايض", true),
        mk("campaign", "ramadan-2026", "Ramadan 2026", "رمضان 2026", true),
        // Ops and clinical tags are internal — they drive fulfilment and safety copy,
        // and must never appear in a storefront filter.
        mk("ops", "cold-chain", "Cold Chain", "سلسلة التبريد", false),
        mk("ops", "controlled-storage", "Controlled Storage", "تخزين مراقب", false),
        mk("clinical", "not-in-pregnancy", "Not During Pregnancy", "ليس أثناء الحمل", false),
        mk("clinical", "rx-required", "Prescription Required", "يتطلب وصفة طبية", false),
        // A category manager's request, waiting on an admin.
        mk("goal", "gut-health", "Gut Health", "صحة الأمعاء", true, "proposed"),
    ]
}

let PROMO_BANNER_STORE: PromoBanner[] | null = null
let PROMO_BANNER_SEQ = 0
const clonePromoBanner = (b: PromoBanner): PromoBanner => JSON.parse(JSON.stringify(b))

function seedPromoBanners(): PromoBanner[] {
    return [
        {
            id: "pb-ramadan",
            name: "Ramadan Offer",
            titleEn: "Ramadan Health Offer",
            titleAr: "عرض رمضان الصحي",
            subtitleEn: "Save 20% on your wellness journey this Ramadan.",
            subtitleAr: "وفر 20% في رحلتك الصحية هذا الشهر الكريم.",
            imageUrl: "",
            imageAltEn: "Ramadan promotional banner",
            imageAltAr: "لافتة ترويجية لرمضان",
            couponCode: "RAMADAN20",
            discountType: "percentage",
            discountValue: 20,
            ctaLabelEn: "Shop the offer",
            ctaLabelAr: "تسوق العرض",
            ctaHref: "/catalogue",
            isActive: true,
        },
        {
            id: "pb-welcome",
            name: "New Customer",
            titleEn: "Welcome to Valeo",
            titleAr: "مرحباً بك في فاليو",
            subtitleEn: "Get 10% off your first order.",
            subtitleAr: "احصل على خصم 10% على طلبك الأول.",
            imageUrl: "",
            imageAltEn: "New customer welcome banner",
            imageAltAr: "لافتة ترحيب بالعملاء الجدد",
            couponCode: "WELCOME10",
            discountType: "percentage",
            discountValue: 10,
            ctaLabelEn: "Start now",
            ctaLabelAr: "ابدأ الآن",
            ctaHref: "/catalogue",
            isActive: true,
        },
        {
            id: "pb-summer",
            name: "Summer Clearance",
            titleEn: "Summer Clearance",
            titleAr: "تخفيضات الصيف",
            subtitleEn: "AED 50 off selected supplements.",
            subtitleAr: "خصم 50 درهماً على مكملات مختارة.",
            imageUrl: "",
            couponCode: "SUMMER50",
            discountType: "fixed",
            discountValue: 50,
            ctaLabelEn: "See what's on sale",
            ctaLabelAr: "شاهد العروض",
            ctaHref: "/catalogue",
            isActive: false,
        },
    ]
}

export const ApiService = {
    content: {
        list: async (): Promise<ContentItem[]> => {
            return mockFetch([
                { id: "1", title: "Welcome to Valeo", slug: "welcome", type: "landing_page", status: "published", author: "Admin", updatedAt: new Date().toISOString() },
                { id: "2", title: "About Us", slug: "about", type: "static_page", status: "published", author: "Admin", updatedAt: new Date().toISOString() },
                { id: "3", title: "10 Tips for Better Sleep", slug: "sleep-tips", type: "article", status: "published", author: "Nutritionist A", updatedAt: new Date().toISOString() },
                { id: "4", title: "Spring Sale 2024", slug: "spring-sale", type: "article", status: "draft", author: "Marketing", updatedAt: new Date().toISOString() },
            ])
        },
        get: async (id: string): Promise<ContentItem | null> => {
            return mockFetch({ id, title: "Mock Content", slug: "mock", type: "article", status: "draft", author: "Admin" })
        },
        categories: async (): Promise<ContentCategory[]> => {
            return mockFetch([
                { id: "cat1", name: "Health & Wellness", slug: "health-wellness" },
                { id: "cat2", name: "Nutrition", slug: "nutrition" },
                { id: "cat3", name: "Biohacking", slug: "biohacking" },
            ])
        },
        banners: async (): Promise<Banner[]> => {
            return mockFetch([
                { id: "b1", title: "Main Homepage Hero", location: "Home - Top", status: "active" },
                { id: "b2", title: "Product List Sidebar", location: "Products - Left", status: "active" },
            ])
        },
        socialProof: async (): Promise<SocialProof[]> => {
            return mockFetch([
                { id: "sp1", author: "John Doe", role: "Athlete", content: "Valeo changed my life!", rating: 5, status: "approved" },
                { id: "sp2", author: "Jane Smith", role: "CEO", content: "Highly recommend the blood test.", rating: 5, status: "pending" },
            ])
        },
        faqs: async (): Promise<any[]> => {
            return mockFetch([
                { id: "f1", question: "How long until I get results?", category: "Lab Tests", status: "published" },
                { id: "f2", question: "Can I cancel my subscription?", category: "Billing", status: "published" },
            ])
        },
        navigation: async (): Promise<any[]> => {
            return mockFetch([
                { id: "n1", title: "Main Navbar", type: "desktop", region: "UAE", status: "active" },
                { id: "n2", title: "App Footer", type: "mobile", region: "ALL", status: "active" },
            ])
        },
        seo: async (): Promise<any[]> => {
            return mockFetch([
                { id: "s1", page: "Home", keywords: "longevity, health, wellness", score: 85 },
                { id: "s2", page: "Lab Tests", keywords: "blood test, dubai, biomarkers", score: 92 },
            ])
        }
    },

    products: {
        list: async (): Promise<Product[]> => mockFetch(MOCK_PRODUCTS),
        get: async (id: string): Promise<Product | null> => {
            const found = MOCK_PRODUCTS.find(p => p.id === id)
            return mockFetch(found ?? MOCK_PRODUCTS[0])
        },
        tests: async (): Promise<any[]> => {
            return mockFetch([
                { id: "t1", name: "HbA1c Blood Test", category: "clinical", status: "active", code: "LAB-HB1" },
                { id: "t2", name: "Lipid Profile", category: "cardio", status: "active", code: "LAB-LP2" },
                { id: "t3", name: "Testosterone Total", category: "hormones", status: "active", code: "LAB-TT3" },
                { id: "t4", name: "Thyroid Panel (TSH, T3, T4)", category: "thyroid", status: "active", code: "LAB-THP4" },
            ])
        },
        biomarkers: async (): Promise<any[]> => {
            return mockFetch([
                { id: "b1", name: "Vitamin D", unit: "ng/mL", category: "Vitamins", status: "active" },
                { id: "b2", name: "HbA1c", unit: "%", category: "Metabolic", status: "active" },
                { id: "b3", name: "Testosterone", unit: "nmol/L", category: "Hormones", status: "active" },
                { id: "b4", name: "Ferritin", unit: "ng/mL", category: "Iron Studies", status: "active" },
            ])
        },
        foodIntolerance: async (): Promise<any[]> => {
            return mockFetch([
                { id: "fi1", name: "Gluten Sensitivity", category: "Grains", severity: "high", recommendation: "Avoid wheat, barley, rye." },
                { id: "fi2", name: "Lactose Intolerance", category: "Dairy", severity: "medium", recommendation: "Switch to plant-based milk." },
                { id: "fi3", name: "Egg White Allergy", category: "Proteins", severity: "high", recommendation: "Avoid eggs and egg-derived products." },
            ])
        }
    },

    catalogue: {
        // Zoho routing per country × product type × clinical class:
        //   UAE      → DMCC / KUA · except GLP-1 / weight-loss → Shifa (zero-rated)
        //   KSA      → Value Health IT (service packages) · Saha (supplements)
        //   KUWAIT   → Integrative (everything)
        //   QATAR    → no invoices are created at all (invoicingEnabled: false)
        //
        // Hand-authored rows and generated rows can name the SAME sub-department id.
        // `find(sd => sd.id === ...)` then returned whichever came first, so a slug
        // gate could match or miss depending on array order — the same defect class
        // as duplicate composition scope rows. mergeSubDepartments folds them into one
        // row per id: hand-authored scalars win, countryConfig is unioned per country
        // so a hand-added market (Kuwait) is never dropped by the merge.
        // Org IDs to be confirmed by finance — known IDs in use: 751813311, 841313343, 851585320 (entity mapping unconfirmed)
        // The Design Model spine — artifact 5f436313, owned by src/lib/taxonomy.ts.
        // This used to concatenate 10 hand-written rows with 16 generated ones and
        // return 26, two of them duplicate ids with conflicting names.
        subDepartments: async (): Promise<SubDepartment[]> => mockFetch(SUB_DEPARTMENTS),
        journeys: async (): Promise<Journey[]> => mockFetch([
            { id: "jr-direct", nameEn: "Direct", nameAr: "مباشر", slug: "direct", kind: "direct", isActive: true, listingIds: [] },
            {
                id: "jr-weightloss", nameEn: "Weight Loss", nameAr: "إنقاص الوزن", slug: "weight-loss", kind: "program", isActive: true, listingIds: ["p1", "l-glp1"],
                pageBlocks: [
                    { id: "b1", type: "HERO_SECTION", rank: 0, isActive: true, config: { headingEn: "Lose weight, medically guided", headingAr: "فقدان الوزن بإشراف طبي", subheadingEn: "GLP-1 programs with doctor supervision and home delivery.", subheadingAr: "", ctaLabelEn: "Start now", ctaLabelAr: "ابدأ الآن", ctaHref: "/catalogue/listings/l-glp1", priceLabel: "From AED 899/mo", imageUrl: "https://cdn.example.com/wl-hero.webp", imageAltEn: "Weight loss program", imageAltAr: "" } },
                    { id: "b2", type: "USP", rank: 1, isActive: true, config: { headingEn: "Why it works", headingAr: "لماذا ينجح", items: [
                        { id: "u1", titleEn: "Doctor-led", textEn: "Every plan reviewed by a clinician", rank: 0 },
                        { id: "u2", titleEn: "GLP-1 medication", textEn: "Clinically proven appetite control", rank: 1 },
                        { id: "u3", titleEn: "Delivered home", textEn: "Discreet monthly delivery", rank: 2 },
                    ] } },
                    { id: "b3", type: "PRODUCT_LIST", rank: 2, isActive: true, config: { headingEn: "Included in your program", headingAr: "مشمول في برنامجك", listingIds: ["l-glp1", "p1"] } },
                    { id: "b4", type: "FAQ", rank: 3, isActive: true, config: { headingEn: "Common questions", headingAr: "أسئلة شائعة", faq: [
                        { questionEn: "Is it safe?", questionAr: "هل هو آمن؟", answerEn: "All programs are clinician-supervised.", answerAr: "", sortOrder: 0 },
                        { questionEn: "How fast are results?", questionAr: "", answerEn: "Most see changes within 4–8 weeks.", answerAr: "", sortOrder: 1 },
                    ] } },
                ],
                retention: [
                    { country: "UAE", slots: [
                        { key: "free_coach", titleEn: "Free Coach Consultation Package", titleAr: "باقة استشارة مجانية", listingIds: ["l-consult"], isActive: true },
                        { key: "top_picks", titleEn: "Top Picks for your Journey", titleAr: "أفضل الاختيارات لرحلتك", listingIds: ["l-glp1", "p1"], isActive: true },
                        { key: "support_beyond_medication", titleEn: "Support Beyond Medication", titleAr: "دعم يتجاوز الدواء", listingIds: ["p1"], isActive: true },
                        { key: "recommended_tests", titleEn: "Recommended Tests For you", titleAr: "الفحوصات الموصى بها", listingIds: ["l-blood"], isActive: true },
                    ] },
                ],
                partnerAccess: [
                    { partnerId: "pt-emaar", accessType: "viewer" },
                ],
            },
            { id: "jr-longevity", nameEn: "Longevity", nameAr: "طول العمر", slug: "longevity", kind: "program", isActive: true, listingIds: ["p2"] },
        ]),
        categoryManagers: async (): Promise<CategoryManager[]> => mockFetch([
            { id: "cm1", name: "Layla Hassan", email: "layla@valeo.com", department: "diagnostics" },
            { id: "cm2", name: "Omar Farouk", email: "omar@valeo.com", department: "treatments" },
            { id: "cm3", name: "Nadia Rahman", email: "nadia@valeo.com", department: "health_products" },
            { id: "cm4", name: "Yusuf Ali", email: "yusuf@valeo.com", department: "consultations" },
        ]),
        serviceProviders: async (): Promise<ServiceProvider[]> => mockFetch([
            { id: "sp1", name: "Dubai Central Lab", type: "lab", internalCategoryId: "ic-fasting", isActive: true },
            { id: "sp2", name: "Valeo Home Nurses", type: "homecare", internalCategoryId: "ic-athome", isActive: true },
            { id: "sp3", name: "Longevity Clinic DXB", type: "clinic", internalCategoryId: "ic-clinic", isActive: true },
            { id: "sp4", name: "Valeo Pharmacy", type: "pharmacy", internalCategoryId: "ic-rx", isActive: true },
        ]),
        // REAL — GET /internal-categories. The four hand-written rows that were here
        // (ic-fasting, ic-athome, ic-clinic, ic-rx) are gone: the service returns the
        // 41 seeded categories with the ids ops knows (IV=5, Physio=6, Supplements=11,
        // Medicine=15), and inventing a fifth vocabulary beside them is how the two
        // drift. Every caller of this function now gets real data.
        //
        // Deliberately NOT wrapped in a try/catch that falls back to mock rows: a
        // silent fallback would put invented categories into a real save. A caller
        // that needs to survive the service being down handles the rejection itself.
        internalCategories: (): Promise<InternalCategory[]> => fetchInternalCategories(),
        // "Where it appears" — web/app merchandising taxonomy (shared across surfaces).
        categories: async (): Promise<Category[]> => mockFetch([
            { id: "cat-goals", nameEn: "Shop by Goal", nameAr: "تسوق حسب الهدف", slug: "shop-by-goal", visibleOn: "both", sortOrder: 0, isActive: true },
            { id: "cat-tests", nameEn: "Lab Tests", nameAr: "الفحوصات المخبرية", slug: "lab-tests", visibleOn: "both", sortOrder: 1, isActive: true },
            { id: "cat-supplements", nameEn: "Supplements", nameAr: "المكملات", slug: "supplements", visibleOn: "both", sortOrder: 2, isActive: true },
            { id: "cat-treatments", nameEn: "Treatments", nameAr: "العلاجات", slug: "treatments", visibleOn: "web", sortOrder: 3, isActive: true },
            ...MIGRATED_CATEGORIES,
            ...PACKAGE_CATEGORIES,
        ]),
        subCategories: async (): Promise<SubCategory[]> => mockFetch([
            { id: "sc-energy", categoryId: "cat-goals", nameEn: "Energy & Focus", nameAr: "الطاقة والتركيز", slug: "energy-focus", visibleOn: "both", sortOrder: 0, isActive: true },
            { id: "sc-weight", categoryId: "cat-goals", nameEn: "Weight Management", nameAr: "إدارة الوزن", slug: "weight-management", visibleOn: "both", sortOrder: 1, isActive: true },
            { id: "sc-longevity", categoryId: "cat-goals", nameEn: "Longevity", nameAr: "طول العمر", slug: "longevity", visibleOn: "both", sortOrder: 2, isActive: true },
            { id: "sc-mens", categoryId: "cat-tests", nameEn: "Men's Health Panels", nameAr: "فحوصات صحة الرجل", slug: "mens-health", visibleOn: "both", sortOrder: 0, isActive: true },
            { id: "sc-hormones", categoryId: "cat-tests", nameEn: "Hormone Panels", nameAr: "فحوصات الهرمونات", slug: "hormone-panels", visibleOn: "both", sortOrder: 1, isActive: true },
            { id: "sc-vitamins", categoryId: "cat-supplements", nameEn: "Vitamins", nameAr: "الفيتامينات", slug: "vitamins", visibleOn: "both", sortOrder: 0, isActive: true },
            { id: "sc-iv", categoryId: "cat-treatments", nameEn: "IV Drips", nameAr: "التنقيط الوريدي", slug: "iv-drips", visibleOn: "web", sortOrder: 0, isActive: true },
            ...MIGRATED_SUBCATEGORIES,
            ...PACKAGE_SUBCATEGORIES,
        ]),
        // REAL — GET /products. The hand-written rows that were here (vitamin-d3-boost,
        // myers-cocktail-iv, semaglutide-glp1, comprehensive-male-profile, longevity-consult
        // and the rest) are gone: real products now exist beside them, and a list mixing
        // invented rows with database rows is worse than either alone. Every caller of
        // this function — the Listings screen and the fifteen pickers in journeys,
        // categories, protocols, compositions, flash sales, retention, articles, the
        // health team and the program builder — now picks from real products.
        //
        // LISTINGS_STORE is still filled, because the local write path (createListing /
        // updateListing, used only for a listing the editor created locally) reads it.
        // It is now a CACHE of server rows rather than a source of invented ones.
        //
        // Not wrapped in a fallback to mock rows on failure: a picker silently offering
        // four fictional products is how a fictional id ends up saved against a real one.
        listings: async (): Promise<Listing[]> => {
            LISTINGS_STORE = await fetchAllProducts()
            return LISTINGS_STORE.map(cloneListing)
        },
        getListing: async (id: string): Promise<Listing | null> => {
            if (!LISTINGS_STORE) await ApiService.catalogue.listings()
            const found = LISTINGS_STORE!.find(l => l.id === id)
            return mockFetch(found ? cloneListing(found) : null)
        },
        /** Mint a draft listing (first save) — assigns an id and persists it. */
        createListing: async (listing: Listing): Promise<Listing> => {
            if (!LISTINGS_STORE) await ApiService.catalogue.listings()
            const id = `lst-${Date.now().toString(36)}-${(++LISTING_SEQ).toString(36)}`
            // uid is GENERATED here and nowhere else (D-C53) — the editor displays it
            // read-only and a write is rejected. Absent for a sub-department with no
            // `departments` row (the two `-unplaced` seeds), which is the honest answer.
            const internalCode = listing.internalCode
                ?? buildInternalCode(listing.subDepartmentId, ++PRODUCT_ID_SEQ)
            const created = cloneListing({ ...listing, id, internalCode })
            LISTINGS_STORE!.unshift(created)
            // Audit: a create has no prior state → empty changes (renders "Created draft").
            auditStore.record({ entityType: "listing", entityId: created.id, entityName: created.displayNameEn || created.internalName || created.id, action: "create", changes: [] })
            return mockFetch(cloneListing(created))
        },
        /** Persist a section's worth of edits onto an existing listing. */
        updateListing: async (id: string, patch: Partial<Listing>): Promise<Listing> => {
            if (!LISTINGS_STORE) await ApiService.catalogue.listings()
            const idx = LISTINGS_STORE!.findIndex(l => l.id === id)
            if (idx === -1) throw new Error(`Listing ${id} not found`)
            const before = cloneListing(LISTINGS_STORE![idx])
            // internalCode is read-only after minting (D-C53: "on write: REJECTED").
            // Strip it from any patch rather than trusting the caller not to send it.
            const { internalCode: _ignored, ...safePatch } = patch
            LISTINGS_STORE![idx] = cloneListing({ ...LISTINGS_STORE![idx], ...safePatch, id })
            const after = LISTINGS_STORE![idx]
            // Audit: diff before→after; record only when something actually changed.
            const changes = diffEntities(before, after, LISTING_LABELS, LISTING_AUDIT_IGNORE)
            if (changes.length) {
                const onlyStatus = changes.length === 1 && changes[0].field === "status"
                auditStore.record({ entityType: "listing", entityId: id, entityName: after.displayNameEn || after.internalName || id, action: onlyStatus ? "status_change" : "update", changes })
            }
            return mockFetch(cloneListing(after))
        },
        audit: auditStore,
        /**
         * EXTERNAL data, transcribed VERBATIM from
         * `pdp/packages/blood/table data/labslot_city_202608201508.csv` (34 rows, one
         * inactive) so city-grain pricing can be exercised against the real list rather
         * than seven invented rows. Ids are `city-{labslot_city.id}`, which keeps them
         * traceable to the dump and to `product_pricing.city_id`.
         *
         * ⚠️ Country ids map 1=UAE 2=KSA 3=Others 4=Qatar 5=Kuwait, from
         * `labslot_country_202608201507.csv`. `Others` is a real labslot country, not a
         * placeholder — 32 IV/blood rows are filed against it.
         *
         * Order follows each country's `position_value`, so the list reads the way the
         * app's own city pickers do. Inactive rows are KEPT and flagged rather than
         * filtered: a price row may still exist against a city that has been switched
         * off, and dropping it here would hide that.
         *
         * Replace this with the real endpoint when the APIs land — nothing else needs to
         * change, since callers only read `id`, `name`, `country` and `isActive`.
         */
        // REAL — GET /cities. The 34 rows come from city_info, which is itself a
        // replica of labslot_city, so the hand-written list here was a third copy.
        cities: (): Promise<City[]> => fetchCities(),
        partners: async (): Promise<CataloguePartner[]> => mockFetch([
            // DEWA is a real corporate client: four migrated consultation listings
            // carry "DEWA" in their title, three of them duplicating a consumer
            // listing for the same practitioner.
            { id: "pt-dewa", code: "DEWA", name: "DEWA — Dubai Electricity & Water Authority", email: "wellness@dewa.gov.ae", contactPerson: "Corporate Wellness", partnerType: "corporate", countries: ["UAE"], isActive: true },
            { id: "pt-noon", code: "NOON", name: "Noon Health", email: "b2b@noon.com", contactPerson: "Sara K.", partnerType: "b2b_client", isActive: true },
            { id: "pt-emaar", code: "EMAAR", name: "Emaar Corporate Wellness", email: "wellness@emaar.ae", contactPerson: "Omar F.", partnerType: "corporate", isActive: true },
            { id: "pt-daman", code: "DAMAN", name: "Daman Insurance", email: "partners@daman.ae", contactPerson: "Layla H.", partnerType: "external", isActive: true },
            { id: "pt-adnoc", code: "ADNOC", name: "ADNOC Employee Health", email: "health@adnoc.ae", contactPerson: "Yusuf A.", partnerType: "corporate", isActive: false },
        ]),
        // Mock source-system feeds (prototype stand-ins for the real integrations).
        // Zoho Books is per-country (each country has its own Zoho Book), so the
        // catalogue variant editor filters these by the row's country.
        zohoBookItems: async (country?: Country): Promise<{ zohoId: string; name: string; country: Country }[]> => {
            const all: { zohoId: string; name: string; country: Country }[] = [
                // UAE Zoho Book
                { country: "UAE", zohoId: "ZB-UAE-1001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "UAE", zohoId: "ZB-UAE-1002", name: "Vitamin D3 5000 IU — 120 Caps" },
                { country: "UAE", zohoId: "ZB-UAE-1003", name: "Comprehensive Male Profile" },
                { country: "UAE", zohoId: "ZB-UAE-1004", name: "Semaglutide 0.25mg Pen" },
                { country: "UAE", zohoId: "ZB-UAE-1005", name: "Myers Cocktail IV Drip" },
                { country: "UAE", zohoId: "ZB-UAE-1006", name: "Omega-3 Fish Oil — 90 Softgels" },
                // KSA Zoho Book
                { country: "KSA", zohoId: "ZB-KSA-2001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "KSA", zohoId: "ZB-KSA-2002", name: "Vitamin D3 5000 IU — 120 Caps" },
                { country: "KSA", zohoId: "ZB-KSA-2003", name: "Comprehensive Male Profile" },
                { country: "KSA", zohoId: "ZB-KSA-2004", name: "Semaglutide 0.5mg Pen" },
                { country: "KSA", zohoId: "ZB-KSA-2005", name: "Magnesium Glycinate — 120 Caps" },
                // QATAR Zoho Book
                { country: "QATAR", zohoId: "ZB-QAT-3001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "QATAR", zohoId: "ZB-QAT-3002", name: "Comprehensive Male Profile" },
                { country: "QATAR", zohoId: "ZB-QAT-3003", name: "Myers Cocktail IV Drip" },
                { country: "QATAR", zohoId: "ZB-QAT-3004", name: "Zinc Picolinate — 60 Caps" },
                // KUWAIT Zoho Book
                { country: "KUWAIT", zohoId: "ZB-KWT-4001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "KUWAIT", zohoId: "ZB-KWT-4002", name: "Comprehensive Male Profile" },
                { country: "KUWAIT", zohoId: "ZB-KWT-4003", name: "Semaglutide 0.25mg Pen" },
                { country: "KUWAIT", zohoId: "ZB-KWT-4004", name: "Probiotic Complex — 30 Caps" },
                // OTHERS Zoho Book
                { country: "OTHERS", zohoId: "ZB-OTH-5001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "OTHERS", zohoId: "ZB-OTH-5002", name: "Comprehensive Male Profile" },
                { country: "OTHERS", zohoId: "ZB-OTH-5003", name: "Oura Ring Gen 4" },
                { country: "OTHERS", zohoId: "ZB-OTH-5004", name: "Collagen Peptides — 300g" },
            ]
            return mockFetch(country ? all.filter(i => i.country === country) : all)
        },
        // Unicommerce SKUs / item codes (per country too). Same shape/pattern.
        unicommerceSkus: async (country?: Country): Promise<{ sku: string; itemCode: string; name: string; country: Country }[]> => {
            const all: { sku: string; itemCode: string; name: string; country: Country }[] = [
                // UAE
                { country: "UAE", sku: "SKU-UAE-VD3-60", itemCode: "IC-UAE-10001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "UAE", sku: "SKU-UAE-VD3-120", itemCode: "IC-UAE-10002", name: "Vitamin D3 5000 IU — 120 Caps" },
                { country: "UAE", sku: "SKU-UAE-CMP-01", itemCode: "IC-UAE-10003", name: "Comprehensive Male Profile" },
                { country: "UAE", sku: "SKU-UAE-SEM-025", itemCode: "IC-UAE-10004", name: "Semaglutide 0.25mg Pen" },
                { country: "UAE", sku: "SKU-UAE-OMG-90", itemCode: "IC-UAE-10005", name: "Omega-3 Fish Oil — 90 Softgels" },
                // KSA
                { country: "KSA", sku: "SKU-KSA-VD3-60", itemCode: "IC-KSA-20001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "KSA", sku: "SKU-KSA-VD3-120", itemCode: "IC-KSA-20002", name: "Vitamin D3 5000 IU — 120 Caps" },
                { country: "KSA", sku: "SKU-KSA-CMP-01", itemCode: "IC-KSA-20003", name: "Comprehensive Male Profile" },
                { country: "KSA", sku: "SKU-KSA-SEM-050", itemCode: "IC-KSA-20004", name: "Semaglutide 0.5mg Pen" },
                { country: "KSA", sku: "SKU-KSA-MAG-120", itemCode: "IC-KSA-20005", name: "Magnesium Glycinate — 120 Caps" },
                // QATAR
                { country: "QATAR", sku: "SKU-QAT-VD3-60", itemCode: "IC-QAT-30001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "QATAR", sku: "SKU-QAT-CMP-01", itemCode: "IC-QAT-30002", name: "Comprehensive Male Profile" },
                { country: "QATAR", sku: "SKU-QAT-IV-01", itemCode: "IC-QAT-30003", name: "Myers Cocktail IV Drip" },
                { country: "QATAR", sku: "SKU-QAT-ZNC-60", itemCode: "IC-QAT-30004", name: "Zinc Picolinate — 60 Caps" },
                // KUWAIT
                { country: "KUWAIT", sku: "SKU-KWT-VD3-60", itemCode: "IC-KWT-40001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "KUWAIT", sku: "SKU-KWT-CMP-01", itemCode: "IC-KWT-40002", name: "Comprehensive Male Profile" },
                { country: "KUWAIT", sku: "SKU-KWT-SEM-025", itemCode: "IC-KWT-40003", name: "Semaglutide 0.25mg Pen" },
                { country: "KUWAIT", sku: "SKU-KWT-PRO-30", itemCode: "IC-KWT-40004", name: "Probiotic Complex — 30 Caps" },
                // OTHERS
                { country: "OTHERS", sku: "SKU-OTH-VD3-60", itemCode: "IC-OTH-50001", name: "Vitamin D3 5000 IU — 60 Caps" },
                { country: "OTHERS", sku: "SKU-OTH-CMP-01", itemCode: "IC-OTH-50002", name: "Comprehensive Male Profile" },
                { country: "OTHERS", sku: "SKU-OTH-OUR-G4", itemCode: "IC-OTH-50003", name: "Oura Ring Gen 4" },
                { country: "OTHERS", sku: "SKU-OTH-COL-300", itemCode: "IC-OTH-50004", name: "Collagen Peptides — 300g" },
            ]
            return mockFetch(country ? all.filter(i => i.country === country) : all)
        },
        protocols: async (): Promise<Protocol[]> => mockFetch([
            {
                id: "prot-glp1-wl", code: "PROT-GLP1-WL",
                nameEn: "GLP-1 Weight Management Protocol", nameAr: "بروتوكول إدارة الوزن GLP-1",
                descriptionEn: "Clinician-led weight-management pathway built around GLP-1 titration with lab and consultation gating.",
                descriptionAr: "",
                clinicianAuthor: "Dr. Layla Hassan", targetCondition: "Weight management / obesity",
                journeyId: "jr-weightloss", status: "active", isActive: true,
                // ── FOURTEEN STEPS, AND NO DATES ──
                //
                // The order is the dependency: step N unlocks when N−1 is done.
                // `produces` and `requires` make that order checkable — the
                // consultation needs a report, and the step above it produces
                // one — and neither field is a time.
                //
                // The COUNT is also the package: one step that links a unit
                // puts one unit in the package, so three dispatch steps mean
                // three pens. Two of the fourteen link nothing, because a
                // results review and a baseline are work, not a line item.
                variantAxis: { attribute: "sex", values: ["male", "female"] },
                // ── THE ORDERS, AND WHY THEY ARE LISTED ──
                //
                // Eleven orders for fourteen steps over six items. No two of
                // those numbers are equal, which is exactly why a step's linked
                // unit cannot name its order: steps 1 and 14 share the panel,
                // 7/11/13 share the pen, 8/9/12 share the GP consult, and steps
                // 2 and 3 link nothing while being the most order-driven steps
                // in the protocol.
                fulfilments: [
                    { id: "f-panel", label: "Baseline panel", unit: { listingId: "demo-panel-male", kind: "service_option", unitId: "so-standard" } },
                    { id: "f-results", label: "Results review", unit: { listingId: "demo-consult-peptide", kind: "variant", unitId: "demo-consult-peptide-v1" } },
                    { id: "f-med1", label: "Month 1 pen", unit: { listingId: "demo-med-glp1", kind: "variant", unitId: "demo-med-glp1-v1" } },
                    { id: "f-voucher", label: "Supplement voucher", unit: { listingId: "demo-voucher-supp", kind: "variant", unitId: "demo-voucher-supp-v1" } },
                    { id: "f-call1", label: "Concierge call 1", unit: { listingId: "demo-consult-gp", kind: "variant", unitId: "demo-consult-gp-v1" } },
                    { id: "f-call2", label: "Concierge call 2", unit: { listingId: "demo-consult-gp", kind: "variant", unitId: "demo-consult-gp-v1" } },
                    { id: "f-review", label: "Mid-point review", unit: { listingId: "demo-followup-review", kind: "variant", unitId: "demo-followup-review-v1" } },
                    { id: "f-med2", label: "Month 2 pen", unit: { listingId: "demo-med-glp1", kind: "variant", unitId: "demo-med-glp1-v1" } },
                    { id: "f-call3", label: "Concierge call 3", unit: { listingId: "demo-consult-gp", kind: "variant", unitId: "demo-consult-gp-v1" } },
                    { id: "f-med3", label: "Month 3 pen", unit: { listingId: "demo-med-glp1", kind: "variant", unitId: "demo-med-glp1-v1" } },
                    { id: "f-repeat", label: "Repeat panel", unit: { listingId: "demo-panel-male", kind: "service_option", unitId: "so-standard" } },
                ],
                steps: [
                    {
                        id: "s1", order: 0,
                        advance: { fulfilmentId: "f-panel", field: "child_order_status", completesOn: ["ORDER_CONFIRMED"] },
                        waitingEn: "We are finding you a nurse", titleEn: "Book the nurse visit", titleAr: "حجز زيارة الممرض",
                        type: "lab_test", actor: "ops", produces: "booking",
                        // The one step that differs by sex: the panel is not the
                        // same product for a man and a woman.
                        linkedUnit: { listingId: "demo-panel-male", kind: "service_option", unitId: "so-standard" },
                        unitByValue: {
                            male: { listingId: "demo-panel-male", kind: "service_option", unitId: "so-standard" },
                            female: { listingId: "demo-panel-female", kind: "service_option", unitId: "so-standard" },
                        },
                    },
                    {
                        id: "s2", order: 1,
                        advance: { fulfilmentId: "f-panel", field: "booking_status", completesOn: ["SAMPLE_COLLECTED"], retriesOn: ["CHANGE_NURSE"] },
                        waitingEn: "Your nurse is on the way", titleEn: "Nurse draws the blood sample", titleAr: "سحب عينة الدم",
                        type: "lab_test", actor: "nurse", requires: "booking", produces: "sample",
                    },
                    {
                        id: "s3", order: 2,
                        advance: { fulfilmentId: "f-panel", field: "child_order_status", completesOn: ["REPORT_RECEIVED"], retriesOn: ["RECOLLECTION"] },
                        waitingEn: "The lab is running your panel", titleEn: "Lab runs the panel", titleAr: "المختبر يجري التحليل",
                        type: "lab_test", actor: "lab", requires: "sample", produces: "report",
                        note: "The turnaround is the lab's, and it is on the catalogue item.",
                    },
                    {
                        id: "s4", order: 3,
                        advance: { fulfilmentId: "f-results", field: "child_order_status", completesOn: ["COMPLETED"] },
                        waitingEn: "Your doctor is reading your results", titleEn: "Doctor reads the results with you", titleAr: "الطبيب يراجع النتائج معك",
                        type: "consultation", actor: "doctor", requires: "report", produces: "assessment",
                        linkedUnit: { listingId: "demo-consult-peptide", kind: "variant", unitId: "demo-consult-peptide-v1" },
                    },
                    {
                        id: "s5", order: 4,
                        advance: { fulfilmentId: "f-med1", field: "prescription_status", completesOn: ["APPROVED"] },
                        waitingEn: "Your prescription is with a clinician", titleEn: "Prescription written", titleAr: "كتابة الوصفة",
                        type: "medication", actor: "doctor", requires: "assessment", produces: "prescription",
                        dosing: "Semaglutide, weekly titration",
                    },
                    {
                        id: "s6", order: 5,
                        advance: { fulfilmentId: "f-voucher", field: "child_order_status", completesOn: ["COMPLETED"] },
                        waitingEn: "Your supplement voucher is on its way", titleEn: "Supplement voucher issued", titleAr: "إصدار قسيمة المكملات",
                        type: "lifestyle", actor: "system", requires: "assessment",
                        linkedUnit: { listingId: "demo-voucher-supp", kind: "variant", unitId: "demo-voucher-supp-v1" },
                    },
                    {
                        id: "s7", order: 6,
                        advance: { fulfilmentId: "f-med1", field: "child_order_status", completesOn: ["SHIPPED"] },
                        waitingEn: "Your first month is on its way", titleEn: "Month 1 dispatched", titleAr: "إرسال الشهر الأول",
                        type: "medication", actor: "ops", requires: "prescription", produces: "delivery",
                        dosing: "Semaglutide 0.25 mg weekly, rising to 1.0 mg",
                        linkedUnit: { listingId: "demo-med-glp1", kind: "variant", unitId: "demo-med-glp1-v1" },
                    },
                    {
                        id: "s8", order: 7,
                        advance: { fulfilmentId: "f-call1", field: "child_order_status", completesOn: ["COMPLETED"] }, titleEn: "Concierge call 1", titleAr: "مكالمة المتابعة الأولى",
                        type: "follow_up", actor: "coach", requires: "delivery",
                        linkedUnit: { listingId: "demo-consult-gp", kind: "variant", unitId: "demo-consult-gp-v1" },
                    },
                    {
                        id: "s9", order: 8,
                        advance: { fulfilmentId: "f-call2", field: "child_order_status", completesOn: ["COMPLETED"] }, titleEn: "Concierge call 2", titleAr: "مكالمة المتابعة الثانية",
                        type: "follow_up", actor: "coach",
                        linkedUnit: { listingId: "demo-consult-gp", kind: "variant", unitId: "demo-consult-gp-v1" },
                    },
                    {
                        id: "s10", order: 9,
                        advance: { fulfilmentId: "f-review", field: "child_order_status", completesOn: ["COMPLETED"] },
                        waitingEn: "Your doctor is reviewing how it is going", titleEn: "Mid-point doctor review", titleAr: "مراجعة الطبيب في منتصف المدة",
                        type: "follow_up", actor: "doctor", produces: "assessment",
                        linkedUnit: { listingId: "demo-followup-review", kind: "variant", unitId: "demo-followup-review-v1" },
                    },
                    {
                        id: "s11", order: 10,
                        advance: { fulfilmentId: "f-med2", field: "child_order_status", completesOn: ["SHIPPED"] },
                        waitingEn: "Your second month is on its way", titleEn: "Month 2 dispatched", titleAr: "إرسال الشهر الثاني",
                        type: "medication", actor: "ops", requires: "prescription", produces: "delivery",
                        dosing: "Semaglutide 0.25 mg weekly, rising to 1.0 mg",
                        linkedUnit: { listingId: "demo-med-glp1", kind: "variant", unitId: "demo-med-glp1-v1" },
                    },
                    {
                        id: "s12", order: 11,
                        advance: { fulfilmentId: "f-call3", field: "child_order_status", completesOn: ["COMPLETED"] }, titleEn: "Concierge call 3", titleAr: "مكالمة المتابعة الثالثة",
                        type: "follow_up", actor: "coach",
                        linkedUnit: { listingId: "demo-consult-gp", kind: "variant", unitId: "demo-consult-gp-v1" },
                    },
                    {
                        id: "s13", order: 12,
                        advance: { fulfilmentId: "f-med3", field: "child_order_status", completesOn: ["SHIPPED"] },
                        waitingEn: "Your third month is on its way", titleEn: "Month 3 dispatched", titleAr: "إرسال الشهر الثالث",
                        type: "medication", actor: "ops", requires: "prescription", produces: "delivery",
                        dosing: "Semaglutide 0.25 mg weekly, rising to 1.0 mg",
                        linkedUnit: { listingId: "demo-med-glp1", kind: "variant", unitId: "demo-med-glp1-v1" },
                    },
                    {
                        id: "s14", order: 13,
                        advance: { fulfilmentId: "f-repeat", field: "child_order_status", completesOn: ["REPORT_RECEIVED"], retriesOn: ["RECOLLECTION"] },
                        waitingEn: "The lab is running your repeat panel", titleEn: "Repeat panel and physician reassessment", titleAr: "إعادة التحليل وتقييم الطبيب",
                        type: "consultation", actor: "doctor", requires: "delivery", produces: "assessment",
                        linkedUnit: { listingId: "demo-panel-male", kind: "service_option", unitId: "so-standard" },
                        unitByValue: {
                            male: { listingId: "demo-panel-male", kind: "service_option", unitId: "so-standard" },
                            female: { listingId: "demo-panel-female", kind: "service_option", unitId: "so-standard" },
                        },
                    },
                ],
            },
            {
                id: "prot-longevity", code: "PROT-LON",
                nameEn: "Longevity Optimization Protocol", nameAr: "بروتوكول تحسين طول العمر",
                descriptionEn: "Comprehensive baseline testing followed by a personalised supplement and follow-up cadence.",
                descriptionAr: "",
                clinicianAuthor: "Dr. Yusuf Ali", targetCondition: "Healthy aging",
                journeyId: "jr-longevity", status: "draft", isActive: false,
                steps: [
                    {
                        id: "s1", order: 0, titleEn: "Longevity consultation", titleAr: "استشارة طول العمر",
                        type: "consultation", actor: "doctor", produces: "assessment",
                        linkedUnit: { listingId: "demo-consult-peptide", kind: "variant", unitId: "demo-consult-peptide-v1" },
                    },
                    {
                        id: "s2", order: 1, titleEn: "Comprehensive blood panel", titleAr: "تحليل دم شامل",
                        type: "lab_test", actor: "lab", requires: "assessment", produces: "report",
                        linkedUnit: { listingId: "demo-panel-male", kind: "service_option", unitId: "so-standard" },
                    },
                    {
                        id: "s3", order: 2, titleEn: "Daily supplement regimen", titleAr: "نظام المكملات اليومي",
                        type: "medication", actor: "patient", requires: "report",
                        dosing: "One sachet each morning",
                        linkedUnit: { listingId: "demo-voucher-supp", kind: "variant", unitId: "demo-voucher-supp-v1" },
                    },
                    {
                        id: "s4", order: 3, titleEn: "Re-test and review", titleAr: "إعادة الفحص والمراجعة",
                        type: "follow_up", actor: "doctor", requires: "report", produces: "assessment",
                        linkedUnit: { listingId: "demo-followup-review", kind: "variant", unitId: "demo-followup-review-v1" },
                    },
                ],
            },
        ]),

        // ── Retention templates (reusable, ranked Section Managers) ──
        retentionTemplates: async (): Promise<RetentionTemplate[]> => {
            if (!RETENTION_STORE) RETENTION_STORE = seedRetentionTemplates()
            return mockFetch(RETENTION_STORE.map(cloneTemplate))
        },
        getRetentionTemplate: async (id: string): Promise<RetentionTemplate | null> => {
            if (!RETENTION_STORE) RETENTION_STORE = seedRetentionTemplates()
            const found = RETENTION_STORE.find(t => t.id === id)
            return mockFetch(found ? cloneTemplate(found) : null)
        },
        createRetentionTemplate: async (t: Partial<RetentionTemplate>): Promise<RetentionTemplate> => {
            if (!RETENTION_STORE) RETENTION_STORE = seedRetentionTemplates()
            const created: RetentionTemplate = {
                id: `rt-${Date.now().toString(36)}`,
                name: t.name?.trim() || "Untitled Retention",
                descriptionEn: t.descriptionEn ?? "",
                sections: t.sections ?? [],
            }
            RETENTION_STORE.unshift(cloneTemplate(created))
            return mockFetch(cloneTemplate(created))
        },
        updateRetentionTemplate: async (id: string, patch: Partial<RetentionTemplate>): Promise<RetentionTemplate> => {
            if (!RETENTION_STORE) RETENTION_STORE = seedRetentionTemplates()
            const idx = RETENTION_STORE.findIndex(t => t.id === id)
            if (idx === -1) throw new Error(`Retention template ${id} not found`)
            const before = cloneTemplate(RETENTION_STORE[idx])
            RETENTION_STORE[idx] = cloneTemplate({ ...RETENTION_STORE[idx], ...patch, id })
            const after = RETENTION_STORE[idx]
            const changes = diffEntities(before, after, LISTING_LABELS)
            if (changes.length) {
                auditStore.record({
                    entityType: "retentionTemplate", entityId: id,
                    entityName: after.name || after.id, action: "update", changes,
                })
            }
            return mockFetch(cloneTemplate(after))
        },

        // ── Promo banners (reusable promotional banners + coupon) ──
        /**
         * Questionnaires — a READ-ONLY feed, exactly like biomarkers and slot groups.
         * A questionnaire owns its questions, options and fact cards; authoring those
         * inside a listing editor would duplicate the Clinical module and put
         * question-grain fields (answer_config, attachment_mode, is_suggestion_decider)
         * at listing grain. The Consultation section REFERENCES one.
         */
        questionnaires: async (country?: Country): Promise<Questionnaire[]> => {
            const all: Questionnaire[] = [
                { id: "qn-weightloss-intake", internalName: "weightloss_intake_v3", displayOrder: 0, status: "ACTIVE", questionCount: 24 },
                { id: "qn-doctor-general", internalName: "doctor_general_intake", displayOrder: 1, status: "ACTIVE", questionCount: 18 },
                { id: "qn-doctor-ksa", internalName: "doctor_general_intake_ksa", country: "KSA", displayOrder: 2, status: "ACTIVE", questionCount: 21 },
                { id: "qn-skin", internalName: "skin_care_questionnaire", displayOrder: 3, status: "ACTIVE", questionCount: 12 },
                { id: "qn-legacy-v1", internalName: "weightloss_intake_v1", displayOrder: 9, status: "INACTIVE", questionCount: 24 },
            ]
            // country_id NULL means every market, so an unscoped row always qualifies
            return mockFetch(country ? all.filter(q => !q.country || q.country === country) : all)
        },
        // ── Diagnostics masters (read-only feeds) ─────────────────────────
        // Biomarkers are AUTHORED in the Admin Portal; the CMS only maps them.
        /**
         * REAL — Postgres (Neon). The analyte master is authored here, so it has
         * to survive a reload; the in-memory list it replaced could not.
         *
         * `panelGroup` is still DERIVED from panel membership rather than stored,
         * which is what keeps `groupBiomarkers()` and the package mapping UI
         * working unchanged now that panels are first-class.
         */
        biomarkers: async (sampleKind?: SampleKind): Promise<Biomarker[]> => {
            const [rows, panels] = await Promise.all([
                fetch("/api/biomarkers").then(r => r.ok ? r.json() : { biomarkers: [] }),
                ApiService.catalogue.biomarkerPanels(),
            ])
            const all = withDerivedPanelGroups(
                (rows.biomarkers ?? []).filter((b: Biomarker) => b.isActive), panels)
            return sampleKind ? all.filter(b => b.sampleKind === sampleKind) : all
        },
        /** Names, specimen and legacy id only — never the authored clinical values. */
        importPrototypeAnalytes: async (): Promise<{ inserted: number; skipped: number }> => {
            const res = await fetch("/api/biomarkers/import-names", { method: "POST" })
            if (!res.ok) throw new Error((await res.json()).error ?? "Import failed")
            return res.json()
        },
        // ── Biomarker model ───────────────────────────────────────
        // Prototype-local in full: the content service publishes Health Products
        // and Treatments only, and has no biomarker, panel, range or code
        // endpoint of any kind. `panelGroup` is derived from panel membership on
        // read so the string and the panels can never disagree.
        /** REAL — Postgres. Panels and their ordered membership. */
        biomarkerPanels: async (): Promise<BiomarkerPanel[]> => {
            const res = await fetch("/api/panels")
            if (!res.ok) return []
            return (await res.json()).panels ?? []
        },
        createBiomarker: async (x: Partial<Biomarker>): Promise<Biomarker> => {
            const id = x.id ?? `bm-new-${(++BM_SEQ).toString(36)}-${x.nameEn?.length ?? 0}`
            const biomarker: Biomarker = {
                id,
                nameEn: x.nameEn?.trim() || "Untitled analyte",
                sampleKind: x.sampleKind ?? "blood",
                isActive: true,
                lifecycle: x.lifecycle ?? "draft",
                ...x,
            }
            const res = await fetch("/api/biomarkers", {
                method: "POST", headers: { "content-type": "application/json" },
                body: JSON.stringify({ biomarker }),
            })
            if (!res.ok) throw new Error((await res.json()).error ?? "Could not create it")
            return (await res.json()).biomarker
        },
        updateBiomarker: async (id: string, patch: Partial<Biomarker>): Promise<Biomarker> => {
            const current = (await fetch("/api/biomarkers").then(r => r.json())).biomarkers ?? []
            const before = current.find((b: Biomarker) => b.id === id)
            if (!before) throw new Error(`Biomarker ${id} not found`)
            const after = { ...before, ...patch, id }
            const res = await fetch("/api/biomarkers", {
                method: "POST", headers: { "content-type": "application/json" },
                body: JSON.stringify({ biomarker: after }),
            })
            if (!res.ok) throw new Error((await res.json()).error ?? "Could not save it")
            const changes: AuditChange[] = diffEntities(before, after, LISTING_LABELS)
            if (changes.length) auditStore.record({ entityType: "biomarker", entityId: id,
                entityName: after.nameEn,
                action: patch.lifecycle && before.lifecycle !== after.lifecycle ? "status_change" : "update",
                changes })
            return (await res.json()).biomarker ?? after
        },
        savePanel: async (x: Partial<BiomarkerPanel>): Promise<BiomarkerPanel> => {
            const panel: BiomarkerPanel = {
                id: x.id || `pnl-new-${(++BM_SEQ).toString(36)}`,
                nameEn: x.nameEn?.trim() || "Untitled panel",
                nameAr: x.nameAr, memberIds: x.memberIds ?? [],
                labPanelCode: x.labPanelCode, isActive: x.isActive ?? true, note: x.note,
            }
            const res = await fetch("/api/panels", {
                method: "POST", headers: { "content-type": "application/json" },
                body: JSON.stringify(panel),
            })
            if (!res.ok) throw new Error((await res.json()).error ?? "Could not save the panel")
            const panels: BiomarkerPanel[] = (await res.json()).panels ?? []
            return panels.find(p => p.id === panel.id) ?? panel
        },
        deletePanel: async (id: string): Promise<void> => {
            const res = await fetch(`/api/panels?id=${encodeURIComponent(id)}`, { method: "DELETE" })
            if (!res.ok) throw new Error((await res.json()).error ?? "Could not delete the panel")
            auditStore.record({ entityType: "biomarkerPanel", entityId: id,
                entityName: id, action: "delete", changes: [] })
        },
        biomarkerRanges: async (biomarkerId?: string): Promise<BiomarkerRange[]> => {
            if (!RANGES_STORE) RANGES_STORE = seedRanges()
            return mockFetch(RANGES_STORE.filter(r => !biomarkerId || r.biomarkerId === biomarkerId))
        },
        saveBiomarkerRanges: async (biomarkerId: string, rows: BiomarkerRange[]): Promise<BiomarkerRange[]> => {
            if (!RANGES_STORE) RANGES_STORE = seedRanges()
            // Whole-scope replace for this analyte. Closed historical rows are
            // preserved untouched — versioning is the point, so an edit may never
            // delete a row someone's past report resolved through.
            const historical = RANGES_STORE.filter(r => r.biomarkerId === biomarkerId && r.effectiveTo)
            RANGES_STORE = [
                ...RANGES_STORE.filter(r => r.biomarkerId !== biomarkerId),
                ...historical,
                ...rows.filter(r => !r.effectiveTo),
            ]
            return mockFetch(RANGES_STORE.filter(r => r.biomarkerId === biomarkerId))
        },
        /**
         * REAL — Postgres. Read from the same place the LOINC create flow writes
         * to; this used to read an in-memory seed, so a code written by that flow
         * was invisible in the editor and re-saving it silently discarded it.
         */
        biomarkerCodes: async (biomarkerId?: string): Promise<BiomarkerCode[]> => {
            const q = biomarkerId ? `?biomarkerId=${encodeURIComponent(biomarkerId)}` : ""
            const res = await fetch(`/api/biomarkers/codes${q}`)
            if (!res.ok) return []
            return (await res.json()).codes ?? []
        },
        saveBiomarkerCodes: async (biomarkerId: string, rows: BiomarkerCode[]): Promise<BiomarkerCode[]> => {
            const res = await fetch("/api/biomarkers/codes", {
                method: "PUT", headers: { "content-type": "application/json" },
                body: JSON.stringify({ biomarkerId, codes: rows }),
            })
            if (!res.ok) throw new Error((await res.json()).error ?? "Could not save the codes")
            return (await res.json()).codes ?? []
        },
        /** REAL — Postgres. These used to live in memory: edits vanished on reload. */
        cyotComponentPrices: async (country?: Country): Promise<CyotComponentPrice[]> => {
            const q = country ? `?country=${encodeURIComponent(country)}` : ""
            const res = await fetch(`/api/component-prices${q}`)
            if (!res.ok) return []
            return (await res.json()).prices ?? []
        },
        saveCyotComponentPrices: async (rows: CyotComponentPrice[]): Promise<CyotComponentPrice[]> => {
            const res = await fetch("/api/component-prices", {
                method: "PUT", headers: { "content-type": "application/json" },
                body: JSON.stringify({ prices: rows }),
            })
            if (!res.ok) throw new Error((await res.json()).error ?? "Could not save the prices")
            return (await res.json()).prices ?? []
        },
        biomarkerLabMappings: async (country?: Country): Promise<BiomarkerLabMapping[]> => {
            if (!LAB_MAPPINGS_STORE) LAB_MAPPINGS_STORE = seedLabMappings()
            return mockFetch(LAB_MAPPINGS_STORE.filter(m => !country || m.country === country))
        },
        cyotConfig: async (): Promise<CyotConfig[]> => {
            if (!CYOT_CONFIG_STORE) CYOT_CONFIG_STORE = seedCyotConfig()
            return mockFetch([...CYOT_CONFIG_STORE])
        },
        saveCyotConfig: async (row: CyotConfig): Promise<CyotConfig[]> => {
            if (!CYOT_CONFIG_STORE) CYOT_CONFIG_STORE = seedCyotConfig()
            const i = CYOT_CONFIG_STORE.findIndex(c => c.country === row.country)
            if (i >= 0) CYOT_CONFIG_STORE[i] = row
            else CYOT_CONFIG_STORE.push(row)
            return mockFetch([...CYOT_CONFIG_STORE])
        },

        diagnosticsLabs: async (country?: Country): Promise<DiagnosticsLab[]> => {
            if (!LABS_STORE) LABS_STORE = seedLabs()
            return mockFetch(LABS_STORE.filter(l => l.isActive && (!country || l.country === country)))
        },
        slotGroups: async (cityId?: string): Promise<SlotGroup[]> => {
            if (!SLOT_GROUPS_STORE) SLOT_GROUPS_STORE = seedSlotGroups()
            // mirrors api/v1/slots/groups?cityId= — city groups plus the national fallback
            return mockFetch(SLOT_GROUPS_STORE.filter(g =>
                g.isActive && (!cityId || !g.cityId || g.cityId === cityId)))
        },
        /** Minis available to add onto / exclude from a proper package. */
        miniPackages: async (): Promise<{ id: string; nameEn: string }[]> => {
            if (!LISTINGS_STORE) await ApiService.catalogue.listings()
            return mockFetch((LISTINGS_STORE ?? [])
                .filter(l => l.department === "diagnostics" && l.diagnostics?.tier === "mini")
                .map(l => ({ id: l.id, nameEn: l.displayNameEn || l.internalName || l.id })))
        },

        // ── Compositions (combos · programs · add-ons · freebies) ────────
        // One primitive over PricedUnitRef: nothing composes listings, everything
        // composes priced units.
        compositions: async (): Promise<Composition[]> => {
            if (!COMPOSITIONS_STORE) COMPOSITIONS_STORE = seedCompositions()
            return mockFetch(COMPOSITIONS_STORE.map(cloneComp))
        },
        createComposition: async (x: Partial<Composition>): Promise<Composition> => {
            if (!COMPOSITIONS_STORE) COMPOSITIONS_STORE = seedCompositions()
            const created: Composition = {
                id: `cmp-${Date.now().toString(36)}-${(++COMP_SEQ).toString(36)}`,
                kind: x.kind ?? "combo", nameEn: x.nameEn?.trim() || "Untitled",
                members: x.members ?? [],
                rule: x.rule ?? { kind: "bundle_price" },
                trigger: x.trigger ?? { kind: "always" },
                // A composition with no scope row sells NOWHERE. Four regulators, four
                // clocks and a Qatar that issues no invoices make default-on a
                // compliance event, so the operator adds the first market explicitly.
                scopes: x.scopes ?? [], status: "draft", ...x,
            }
            COMPOSITIONS_STORE.unshift(cloneComp(created))
            auditStore.record({ entityType: "composition", entityId: created.id,
                entityName: created.nameEn, action: "create", changes: [] })
            return mockFetch(cloneComp(created))
        },
        updateComposition: async (id: string, patch: Partial<Composition>): Promise<Composition> => {
            if (!COMPOSITIONS_STORE) COMPOSITIONS_STORE = seedCompositions()
            const i = COMPOSITIONS_STORE.findIndex(c => c.id === id)
            if (i === -1) throw new Error(`Composition ${id} not found`)
            const before = cloneComp(COMPOSITIONS_STORE[i])
            const after = { ...before, ...patch, id }
            COMPOSITIONS_STORE[i] = cloneComp(after)
            // The old whitelist recorded nameEn/kind/status, the rule KIND, and the
            // member COUNT — so a bundle price moving, a market being retired, or a
            // member swapped at equal count all left no trace. It reaches those now.
            const changes: AuditChange[] = diffEntities(before, after, LISTING_LABELS)
            if (changes.length) auditStore.record({ entityType: "composition", entityId: id,
                entityName: after.nameEn,
                action: patch.status && before.status !== after.status ? "status_change" : "update", changes })
            return mockFetch(cloneComp(after))
        },

        // ── Health Team (practitioner directory) ─────────────────────────
        // People are profiles with landing pages, never products. 1:1 with the
        // User Service; blog authorship resolves through this directory.
        healthTeam: async (): Promise<Practitioner[]> => {
            if (!HEALTH_TEAM_STORE) HEALTH_TEAM_STORE = HEALTH_TEAM.map(x => seedCoachRoles(clonePr(x)))
            return mockFetch(HEALTH_TEAM_STORE.map(clonePr))
        },
        createPractitioner: async (x: Partial<Practitioner>): Promise<Practitioner> => {
            if (!HEALTH_TEAM_STORE) HEALTH_TEAM_STORE = HEALTH_TEAM.map(x => seedCoachRoles(clonePr(x)))
            const sl = (x.slug || x.nameEn || "member").trim().toLowerCase()
                .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
            if (HEALTH_TEAM_STORE.some(t => t.slug === sl)) throw new Error(`"${sl}" already exists`)
            const created: Practitioner = {
                id: `ht-${sl}`, kind: x.kind ?? "health_coach", nameEn: x.nameEn?.trim() || "New member",
                slug: sl, status: "draft", sortOrder: HEALTH_TEAM_STORE.length,
                userServiceId: x.userServiceId ?? "", email: x.email ?? "", ...x,
            }
            HEALTH_TEAM_STORE.unshift(clonePr(created))
            auditStore.record({ entityType: "practitioner", entityId: created.id,
                entityName: created.nameEn, action: "create", changes: [] })
            return mockFetch(clonePr(created))
        },
        updatePractitioner: async (id: string, patch: Partial<Practitioner>): Promise<Practitioner> => {
            if (!HEALTH_TEAM_STORE) HEALTH_TEAM_STORE = HEALTH_TEAM.map(x => seedCoachRoles(clonePr(x)))
            const i = HEALTH_TEAM_STORE.findIndex(t => t.id === id)
            if (i === -1) throw new Error(`Practitioner ${id} not found`)
            const before = clonePr(HEALTH_TEAM_STORE[i])
            const after = { ...before, ...patch, id }
            HEALTH_TEAM_STORE[i] = clonePr(after)
            // reaches licences[] — a DHA licence expiring is history someone needs
            const changes: AuditChange[] = diffEntities(before, after, LISTING_LABELS)
            if (changes.length) auditStore.record({ entityType: "practitioner", entityId: id,
                entityName: after.nameEn, action: patch.status && before.status !== after.status ? "status_change" : "update", changes })
            return mockFetch(clonePr(after))
        },

        // ── Articles (blog) ───────────────────────────────────────────────
        articleCategories: async (): Promise<ArticleCategory[]> => {
            if (!ARTICLE_CATS_STORE) ARTICLE_CATS_STORE = seedArticleCategories()
            return mockFetch(ARTICLE_CATS_STORE.map(c => ({ ...c })))
        },
        createArticleCategory: async (c: Partial<ArticleCategory>): Promise<ArticleCategory> => {
            if (!ARTICLE_CATS_STORE) ARTICLE_CATS_STORE = seedArticleCategories()
            const slug = (c.slug || c.nameEn || "").trim().toLowerCase()
                .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
            if (ARTICLE_CATS_STORE.some(x => x.slug === slug)) {
                throw new Error(`"${slug}" already exists`)
            }
            const created: ArticleCategory = {
                id: `ac-${slug || Date.now().toString(36)}`, nameEn: c.nameEn?.trim() || slug,
                nameAr: c.nameAr ?? "", slug, descriptionEn: c.descriptionEn ?? "",
                sortOrder: ARTICLE_CATS_STORE.length, isActive: c.isActive ?? true,
            }
            ARTICLE_CATS_STORE.push({ ...created })
            return mockFetch({ ...created })
        },
        articles: async (): Promise<Article[]> => {
            if (!ARTICLES_STORE) ARTICLES_STORE = seedArticles()
            return mockFetch(ARTICLES_STORE.map(cloneArticle))
        },
        getArticle: async (id: string): Promise<Article | null> => {
            if (!ARTICLES_STORE) ARTICLES_STORE = seedArticles()
            const f = ARTICLES_STORE.find(a => a.id === id)
            return mockFetch(f ? cloneArticle(f) : null)
        },
        createArticle: async (a: Partial<Article>): Promise<Article> => {
            if (!ARTICLES_STORE) ARTICLES_STORE = seedArticles()
            const created: Article = {
                id: `art-${Date.now().toString(36)}-${(++ARTICLE_SEQ).toString(36)}`,
                titleEn: a.titleEn?.trim() || "Untitled article",
                titleAr: a.titleAr ?? "",
                slug: (a.slug || a.titleEn || "untitled").trim().toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                categoryIds: a.categoryIds ?? [], bodyEn: a.bodyEn ?? "", bodyAr: a.bodyAr ?? "",
                excerptEn: a.excerptEn ?? "", heroImageUrl: a.heroImageUrl ?? "",
                authorName: a.authorName ?? "", status: a.status ?? "draft",
                tagIds: a.tagIds ?? [], visibleOn: a.visibleOn ?? "both",
                updatedAt: new Date().toISOString(),
            }
            ARTICLES_STORE.unshift(cloneArticle(created))
            auditStore.record({
                entityType: "article", entityId: created.id, entityName: created.titleEn,
                action: "create", changes: [],
            })
            return mockFetch(cloneArticle(created))
        },
        updateArticle: async (id: string, patch: Partial<Article>): Promise<Article> => {
            if (!ARTICLES_STORE) ARTICLES_STORE = seedArticles()
            const i = ARTICLES_STORE.findIndex(a => a.id === id)
            if (i === -1) throw new Error(`Article ${id} not found`)
            const before = cloneArticle(ARTICLES_STORE[i])
            // Read time is derived from the body, never typed — a hand-typed
            // "4 min read" goes stale the first time someone edits a paragraph.
            const body = patch.bodyEn ?? before.bodyEn ?? ""
            const words = body.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length
            const after: Article = {
                ...before, ...patch, id,
                readMinutes: Math.max(1, Math.round(words / 200)),
                updatedAt: new Date().toISOString(),
            }
            ARTICLES_STORE[i] = cloneArticle(after)
            // `readMinutes` and `updatedAt` are re-derived on every save, so they are
            // ignored — otherwise every save records a change nobody made.
            const changes: AuditChange[] = diffEntities(
                before, after, { ...LISTING_LABELS, bodyEn: "Body (EN)", bodyAr: "Body (AR)" },
                ["readMinutes", "updatedAt"])
            if (changes.length) {
                auditStore.record({
                    entityType: "article", entityId: id, entityName: after.titleEn,
                    action: patch.status && before.status !== after.status ? "status_change" : "update",
                    changes,
                })
            }
            return mockFetch(cloneArticle(after))
        },

        // ── Flash sales ───────────────────────────────────────────────────
        // Sales never write onto a listing; the read path resolves the effective
        // price from these rules at request time.
        flashSales: async (): Promise<FlashSale[]> => {
            if (!FLASH_SALES_STORE) FLASH_SALES_STORE = seedFlashSales()
            return mockFetch(FLASH_SALES_STORE.map(cloneSale))
        },
        createFlashSale: async (x: Partial<FlashSale>): Promise<FlashSale> => {
            if (!FLASH_SALES_STORE) FLASH_SALES_STORE = seedFlashSales()
            const day = 86400000
            const created: FlashSale = {
                id: `fs-${Date.now().toString(36)}-${(++FLASH_SEQ).toString(36)}`,
                name: x.name?.trim() || "Untitled flash sale",
                isDraft: x.isDraft ?? true,
                startsAt: x.startsAt ?? new Date(Date.now() + day).toISOString(),
                endsAt: x.endsAt ?? new Date(Date.now() + 3 * day).toISOString(),
                timezone: x.timezone ?? "Asia/Dubai",
                scopeKind: x.scopeKind ?? "tag",
                tagId: x.tagId, listingIds: x.listingIds ?? [],
                pricedUnit: x.pricedUnit ?? "all",
                rules: x.rules ?? [],
                stacksWithCoupons: x.stacksWithCoupons ?? false,
                promoBannerId: x.promoBannerId, landingSlug: x.landingSlug,
                createdByName: x.createdByName,
            }
            FLASH_SALES_STORE.unshift(cloneSale(created))
            auditStore.record({
                entityType: "flashSale", entityId: created.id, entityName: created.name,
                action: "create", changes: [],
            })
            return mockFetch(cloneSale(created))
        },
        updateFlashSale: async (id: string, patch: Partial<FlashSale>): Promise<FlashSale> => {
            if (!FLASH_SALES_STORE) FLASH_SALES_STORE = seedFlashSales()
            const i = FLASH_SALES_STORE.findIndex(x => x.id === id)
            if (i === -1) throw new Error(`Flash sale ${id} not found`)
            const before = cloneSale(FLASH_SALES_STORE[i])
            const after = { ...before, ...patch, id }
            FLASH_SALES_STORE[i] = cloneSale(after)
            // A price change on a live sale is the highest-risk edit in the CMS, so
            // every field that moves is recorded — including per-country discount rules,
            // which the old whitelist collapsed into one summary line.
            const changes: AuditChange[] = diffEntities(before, after, LISTING_LABELS)
            if (changes.length) {
                auditStore.record({
                    entityType: "flashSale", entityId: id, entityName: after.name,
                    action: "update", changes,
                })
            }
            return mockFetch(cloneSale(after))
        },

        // ── Tags ──────────────────────────────────────────────────────────
        // Vocabulary is curated here; listings only APPLY tags. Nothing is ever
        // deleted — a retired tag deactivates, and consolidation goes through
        // mergeTags so the relabel lands in the audit log.
        tags: async (): Promise<Tag[]> => {
            if (!TAGS_STORE) TAGS_STORE = seedTags()
            return mockFetch(TAGS_STORE.map(cloneTag))
        },
        /** How many listings currently carry each tag — shown before any merge or deactivate. */
        tagUsage: async (): Promise<Record<string, number>> => {
            if (!LISTINGS_STORE) await ApiService.catalogue.listings()
            const counts: Record<string, number> = {}
            ;(LISTINGS_STORE ?? []).forEach(l => (l.tagIds ?? []).forEach(id => {
                counts[id] = (counts[id] ?? 0) + 1
            }))
            return mockFetch(counts)
        },
        createTag: async (t: Partial<Tag>): Promise<Tag> => {
            if (!TAGS_STORE) TAGS_STORE = seedTags()
            const slug = (t.slug || t.nameEn || "").trim().toLowerCase()
                .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
            const namespace = t.namespace ?? "goal"
            // Unique within the namespace — this is what stops glp1 / GLP-1 / GLP 1
            // becoming three different tags.
            if (TAGS_STORE.some(x => x.namespace === namespace && x.slug === slug)) {
                throw new Error(`"${namespace}:${slug}" already exists — apply the existing tag instead.`)
            }
            const created: Tag = {
                id: `tag-${namespace}-${slug || `t${++TAG_SEQ}`}`,
                namespace, slug,
                nameEn: t.nameEn?.trim() || slug,
                nameAr: t.nameAr ?? "",
                descriptionEn: t.descriptionEn ?? "",
                status: t.status ?? "active",
                customerFacing: t.customerFacing ?? !["ops", "clinical"].includes(namespace),
                createdByName: t.createdByName,
                createdAt: new Date().toISOString(),
            }
            TAGS_STORE.unshift(cloneTag(created))
            auditStore.record({
                entityType: "tag", entityId: created.id, entityName: `${namespace}:${created.slug}`,
                action: "create", changes: [],
            })
            return mockFetch(cloneTag(created))
        },
        updateTag: async (id: string, patch: Partial<Tag>): Promise<Tag> => {
            if (!TAGS_STORE) TAGS_STORE = seedTags()
            const idx = TAGS_STORE.findIndex(t => t.id === id)
            if (idx === -1) throw new Error(`Tag ${id} not found`)
            const before = TAGS_STORE[idx]
            const after = { ...before, ...patch, id }
            TAGS_STORE[idx] = cloneTag(after)
            const changes = diffEntities(before, after, LISTING_LABELS)
            if (changes.length > 0) {
                auditStore.record({
                    entityType: "tag", entityId: id, entityName: `${after.namespace}:${after.slug}`,
                    action: patch.status && changes.some(c => c.field === "status") ? "status_change" : "update",
                    changes,
                })
            }
            return mockFetch(cloneTag(after))
        },
        /**
         * Fold `fromId` into `intoId`: every listing carrying the loser gets the
         * winner, the loser deactivates (never deleted), and EACH relabelled
         * listing writes its own audit entry — a bulk relabel of 400 listings is
         * 400 changes to someone, and the log is where they find out.
         */
        mergeTags: async (fromId: string, intoId: string): Promise<{ relabelled: number }> => {
            if (!TAGS_STORE) TAGS_STORE = seedTags()
            if (!LISTINGS_STORE) await ApiService.catalogue.listings()
            const from = TAGS_STORE.find(t => t.id === fromId)
            const into = TAGS_STORE.find(t => t.id === intoId)
            if (!from || !into) throw new Error("Both tags must exist")
            if (from.namespace !== into.namespace) throw new Error("Tags can only merge within one namespace")
            let relabelled = 0
            ;(LISTINGS_STORE ?? []).forEach(l => {
                if (!(l.tagIds ?? []).includes(fromId)) return
                const next = [...new Set([...(l.tagIds ?? []).filter(t => t !== fromId), intoId])]
                l.tagIds = next
                relabelled++
                auditStore.record({
                    entityType: "listing", entityId: l.id,
                    entityName: l.displayNameEn || l.internalName || l.id, action: "update",
                    changes: [{
                        field: "tagIds", label: "Tags",
                        oldValue: `${from.namespace}:${from.slug}`, newValue: `${into.namespace}:${into.slug}`,
                    }],
                })
            })
            from.status = "inactive"
            auditStore.record({
                entityType: "tag", entityId: fromId, entityName: `${from.namespace}:${from.slug}`,
                action: "update",
                changes: [{ field: "mergedInto", label: "Merged into", oldValue: `${from.namespace}:${from.slug}`, newValue: `${into.namespace}:${into.slug}` }],
            })
            return mockFetch({ relabelled })
        },

        promoBanners: async (): Promise<PromoBanner[]> => {
            if (!PROMO_BANNER_STORE) PROMO_BANNER_STORE = seedPromoBanners()
            return mockFetch(PROMO_BANNER_STORE.map(clonePromoBanner))
        },
        getPromoBanner: async (id: string): Promise<PromoBanner | null> => {
            if (!PROMO_BANNER_STORE) PROMO_BANNER_STORE = seedPromoBanners()
            const found = PROMO_BANNER_STORE.find(b => b.id === id)
            return mockFetch(found ? clonePromoBanner(found) : null)
        },
        createPromoBanner: async (b: Partial<PromoBanner>): Promise<PromoBanner> => {
            if (!PROMO_BANNER_STORE) PROMO_BANNER_STORE = seedPromoBanners()
            const created: PromoBanner = {
                ...b,
                id: `pb-${Date.now().toString(36)}-${(++PROMO_BANNER_SEQ).toString(36)}`,
                name: b.name?.trim() || "Untitled promo banner",
                titleEn: b.titleEn ?? "",
                isActive: b.isActive ?? true,
            }
            PROMO_BANNER_STORE.unshift(clonePromoBanner(created))
            return mockFetch(clonePromoBanner(created))
        },
        updatePromoBanner: async (id: string, patch: Partial<PromoBanner>): Promise<PromoBanner> => {
            if (!PROMO_BANNER_STORE) PROMO_BANNER_STORE = seedPromoBanners()
            const idx = PROMO_BANNER_STORE.findIndex(b => b.id === id)
            if (idx === -1) throw new Error(`Promo banner ${id} not found`)
            const before = clonePromoBanner(PROMO_BANNER_STORE[idx])
            PROMO_BANNER_STORE[idx] = clonePromoBanner({ ...PROMO_BANNER_STORE[idx], ...patch, id })
            const after = PROMO_BANNER_STORE[idx]
            const changes = diffEntities(before, after, LISTING_LABELS)
            if (changes.length) {
                auditStore.record({
                    entityType: "promoBanner", entityId: id,
                    entityName: after.name || after.id, action: "update", changes,
                })
            }
            return mockFetch(clonePromoBanner(after))
        },
    },

    clinical: {
        surveys: {
            list: async (): Promise<Survey[]> => {
                return mockFetch([
                    { id: "s1", title: "General Health Intake", type: "medical", questionCount: 45, status: "published" },
                    { id: "s2", title: "Lifestyle Assessment", type: "lifestyle", questionCount: 20, status: "draft" },
                ])
            },
            get: async (id: string): Promise<Survey | null> => {
                return mockFetch({ id, title: "General Health Intake", type: "medical", questionCount: 45, status: "published" })
            }
        },
        profiles: {
            list: async (): Promise<HealthProfile[]> => {
                return mockFetch([
                    { id: "hp1", userName: "Alice Smith", completionRate: 85, lastAssessment: "2024-03-01", biotype: "Endomorph", longevityScore: 78 },
                    { id: "hp2", userName: "Bob Johnson", completionRate: 40, lastAssessment: "2024-02-15", biotype: "Mesomorph", longevityScore: 65 },
                ])
            }
        },
        scoring: {
            list: async (): Promise<ScoringRule[]> => {
                return mockFetch([
                    { id: "r1", name: "Vitamin D Deficiency", category: "biomarker", weight: 15, thresholds: "< 30nmol/L" },
                    { id: "r2", name: "Daily Activity Level", category: "survey", weight: 10, thresholds: "Sedentary to Active" },
                ])
            }
        },
        programs: {
            list: async (): Promise<any[]> => {
                return mockFetch([
                    { id: "pg1", name: "Metabolic Reset 2024", duration: "12 Weeks", status: "active", enrollment: 450 },
                    { id: "pg2", name: "Longevity Starter", duration: "4 Weeks", status: "active", enrollment: 1200 },
                ])
            }
        }
    },

    operations: {
        orders: {
            list: async (): Promise<Order[]> => {
                return mockFetch([
                    { id: "o1", orderNumber: "ORD-2023-8821", customerName: "Alice Smith", total: 199, items: [{ name: "Vitamin D", type: "supplement" }], status: "pending" },
                    { id: "o2", orderNumber: "ORD-2023-8822", customerName: "Bob Johnson", total: 1250, items: [{ name: "Premium Health Check", type: "test" }], status: "scheduled" }
                ])
            }
        },
        logistics: {
            list: async (): Promise<LogisticCenter[]> => {
                return mockFetch([
                    { id: "l1", name: "Dubai Central Lab", region: "Dubai", capacity: "high", activeNurses: 12 },
                    { id: "l2", name: "Abu Dhabi Hub", region: "Abu Dhabi", capacity: "medium", activeNurses: 8 },
                ])
            }
        },
        regions: {
            list: async (): Promise<Region[]> => {
                return mockFetch([
                    { id: "re1", name: "United Arab Emirates", countryCode: "UAE", isActive: true },
                    { id: "re2", name: "Saudi Arabia", countryCode: "KSA", isActive: true },
                ])
            }
        },
        bookings: {
            list: async (): Promise<any[]> => {
                return mockFetch([
                    { id: "b1", customer: "Alice Smith", service: "Blood Collection", time: "2024-03-12 09:00", status: "confirmed", professional: "Nurse Jane" },
                    { id: "b2", customer: "Bob Johnson", service: "Longevity Consult", time: "2024-03-12 11:30", status: "pending", professional: "Dr. Sam" },
                ])
            }
        }
    },

    growth: {
        campaigns: {
            list: async (): Promise<Campaign[]> => {
                return mockFetch([
                    { id: "c1", name: "Summer Wellness Sale", type: "discount", reach: "45k", status: "active", startDate: "2023-06-01", endDate: "2023-08-31" },
                    { id: "c2", name: "New User Onboarding", type: "email", reach: "12k", status: "active", startDate: "2023-01-01" },
                ])
            }
        },
        experts: {
            list: async (): Promise<Expert[]> => {
                return mockFetch([
                    { id: "e1", name: "Dr. Sarah Wellness", specialization: "Longevity", rating: 4.9, consultCount: 150 },
                    { id: "e2", name: "Mark Nutrition", specialization: "Performance", rating: 4.7, consultCount: 85 },
                ])
            }
        },
        search: {
            promoKeywords: async (): Promise<any[]> => {
                return mockFetch([
                    { id: "pk1", keywords: ["weight loss", "fat burn"], products: ["Keto Bundle", "Supplements"], platform: "WEB", status: "ACTIVE" },
                    { id: "pk2", keywords: ["energy", "focus"], products: ["Lion's Mane", "B-Complex"], platform: "APP", status: "ACTIVE" },
                ])
            }
        },
        partners: {
            list: async (): Promise<Partner[]> => {
                return mockFetch([
                    { id: "pa1", name: "Elite Fitness Club", type: "gym", status: "active", referralCode: "ELITE20" },
                    { id: "pa2", name: "Dubai Wellness Center", type: "clinic", status: "pending", referralCode: "DWC50" },
                ])
            }
        }
    },
    admin: {
        users: {
            list: async (): Promise<User[]> => {
                return mockFetch([
                    { id: "u1", name: "Alice Admin", email: "alice@valeo.com", role: "admin", status: "active", lastLogin: "2024-03-10T09:00:00Z" },
                    { id: "u2", name: "Dr. Bob", email: "bob@clinic.com", role: "external_nutritionist", status: "active", lastLogin: "2024-03-09T14:30:00Z" },
                    { id: "u3", name: "Charlie Client", email: "charlie@gmail.com", role: "client", status: "active", lastLogin: "2024-03-08T18:15:00Z" },
                    { id: "u4", name: "Lab Tech Sarah", email: "sarah@lab.com", role: "lab", status: "active", lastLogin: "2024-03-10T08:00:00Z" },
                    { id: "u5", name: "John Partner", email: "john@elitegym.com", role: "b2b_partner", status: "active", lastLogin: "2024-03-11T10:00:00Z" },
                ])
            }
        }
    },
    support: {
        tickets: {
            list: async (): Promise<any[]> => {
                return mockFetch([
                    { id: "t1", subject: "Phlebotomy delay in DXB", priority: "high", status: "open", user: "Ahmed", assignedTo: "Sarah Support" },
                    { id: "t2", subject: "Refund for cancelled test", priority: "medium", status: "resolved", user: "Elena", assignedTo: "Mark Concierge" },
                ])
            }
        }
    }
}
