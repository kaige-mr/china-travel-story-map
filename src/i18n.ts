import type { City } from "./domain/story";

export type Language = "zh" | "en";

export const translations = {
  zh: {
    app: {
      livePreview: "实时预览",
      stageTitle: "旅行地图",
      demo: "演示",
      reset: "重置",
      copyLink: "复制链接",
      hideEditor: "隐藏编辑器",
      showEditor: "显示编辑器",
      loading: "正在加载旅行故事...",
      notFoundTitle: "没有找到故事",
      notFoundBody: "这个本地演示只会在当前浏览器保存已发布故事。"
    },
    editor: {
      ariaLabel: "故事编辑器",
      eyebrow: "编辑器",
      heading: "创建旅行故事",
      body: "上传照片，把每段记忆绑定到城市，然后发布本地分享链接。",
      storyTitle: "故事标题",
      preparing: "正在处理照片...",
      upload: "上传旅行照片",
      photos: "张照片",
      cities: "个城市",
      caption: "照片说明",
      cityFor: "这张照片的城市",
      selectCity: "选择城市",
      unassignedPhotos: "待绑定照片",
      unassignedGroup: "待绑定照片分组",
      photoGroup: "照片分组",
      mapPoint: "地图亮点",
      openCityOnMap: "在地图上打开{city}",
      expandGroup: "展开照片分组",
      collapseGroup: "收起照片分组",
      remove: "移除",
      publish: "发布故事",
      compliance: "公开上线需要使用经审核的中国地图来源并标注审图号。",
      batchImportTitle: "批量导入照片",
      batchImportMessage: "您正在导入 {count} 张照片，它们是在同一个城市拍摄的吗？",
      batchImportSkip: "稍后手动分配",
      batchImportConfirm: "确定绑定"
    },
    viewer: {
      ariaLabel: "中国旅行地图",
      eyebrow: "中国旅行地图",
      resetView: "重置视角",
      citiesWithPhotos: "有照片的城市",
      openCityPhotos: "打开{city}的照片",
      cityPhotos: "{city}照片",
      backToMap: "返回地图",
      previousPhoto: "上一张照片",
      nextPhoto: "下一张照片",
      mapSource:
        "演示地图数据：GeoJSON.cn 天地图衍生省级数据。公开发布前需要核验地图来源与审图号。"
    },
    language: {
      label: "语言",
      chinese: "中文",
      english: "English"
    }
  },
  en: {
    app: {
      livePreview: "Live preview",
      stageTitle: "Travel Map",
      demo: "Demo",
      reset: "Reset",
      copyLink: "Copy link",
      hideEditor: "Hide editor",
      showEditor: "Show editor",
      loading: "Loading travel story...",
      notFoundTitle: "Story not found",
      notFoundBody: "This local demo stores published stories in this browser only."
    },
    editor: {
      ariaLabel: "Story editor",
      eyebrow: "Editor",
      heading: "Create Travel Story",
      body: "Upload photos, bind each memory to a city, then publish a local share route.",
      storyTitle: "Story title",
      preparing: "Preparing photos...",
      upload: "Upload travel photos",
      photos: "photos",
      cities: "cities",
      caption: "Caption",
      cityFor: "City for",
      selectCity: "Select city",
      unassignedPhotos: "Unassigned photos",
      unassignedGroup: "Unassigned photos group",
      photoGroup: "photo group",
      mapPoint: "Map point",
      openCityOnMap: "Open {city} on map",
      expandGroup: "Expand photo group",
      collapseGroup: "Collapse photo group",
      remove: "Remove",
      publish: "Publish story",
      compliance: "Public launch needs a reviewed China map source and approval number.",
      batchImportTitle: "Batch Import Photos",
      batchImportMessage: "You are importing {count} photos. Were they taken in the same city?",
      batchImportSkip: "Skip and assign manually",
      batchImportConfirm: "Confirm"
    },
    viewer: {
      ariaLabel: "China Memory Map",
      eyebrow: "China Memory Map",
      resetView: "Reset view",
      citiesWithPhotos: "Cities with photos",
      openCityPhotos: "Open {city} photos",
      cityPhotos: "{city} photos",
      backToMap: "Back to map",
      previousPhoto: "Previous photo",
      nextPhoto: "Next photo",
      mapSource:
        "Demo map data: GeoJSON.cn Tianditu-derived province data. Public release requires reviewed map source and approval number."
    },
    language: {
      label: "Language",
      chinese: "中文",
      english: "English"
    }
  }
} as const;

export function cityDisplayName(city: City, language: Language): string {
  return language === "zh" ? city.localName : city.name;
}

export function cityOptionLabel(city: City, language: Language): string {
  return language === "zh" ? `${city.localName} / ${city.name}` : `${city.name} / ${city.localName}`;
}

export function cityPhotoAriaLabel(city: City, language: Language): string {
  const label = cityDisplayName(city, language);
  return translations[language].viewer.openCityPhotos.replace("{city}", label);
}

export function cityDialogLabel(city: City, language: Language): string {
  const label = cityDisplayName(city, language);
  return translations[language].viewer.cityPhotos.replace("{city}", label);
}

export function validationReason(reason: string, language: Language): string {
  if (language === "en") {
    return reason;
  }

  const reasons: Record<string, string> = {
    "Add at least one photo before publishing.": "发布前至少需要添加一张照片。",
    "Every photo needs a city before publishing.": "发布前每张照片都需要绑定城市。",
    "Every photo needs a supported city.": "每张照片都需要绑定支持的城市。"
  };

  return reasons[reason] ?? reason;
}
