/**
 * 身份头像工具
 * 根据身份值返回对应的头像图片路径
 */

// 身份值到中文文件名的映射表
const IDENTITY_LABEL_MAP = {
  'crush': '暗恋对象',
  'god': '男神',
  'ambiguous': '暧昧对象',
  'pursuer': '追求者',
  'blind_date': '相亲对象',
  'friend': '普通朋友',
  'classmate': '同学',
  'colleague': '同事',
  'boss': '上司',
  'client': '客户',
  'childhood_friend': '发小',
  'ex': '前任',
  'netizen': '网友',
  'game_partner': '游戏搭子',
  'unwanted': '想拒绝的人',
  'meal_partner': '饭搭子',
  'older': '年上',
  'younger': '年下'
}

// 默认头像路径
const DEFAULT_AVATAR = '/assets/images/default-avatar.png'
// 身份头像目录
const IDENTITY_DIR = '/assets/images/identities/'

/**
 * 根据身份值获取对应的头像图片路径
 * @param {string|string[]} identityValue - 身份值（单个或数组）
 * @returns {string} 头像图片路径
 */
function getIdentityAvatarPath(identityValue) {
  if (!identityValue) return DEFAULT_AVATAR

  // 如果是数组，随机选取一个身份
  let values
  if (Array.isArray(identityValue)) {
    if (identityValue.length === 0) return DEFAULT_AVATAR
    const randomIndex = Math.floor(Math.random() * identityValue.length)
    values = [identityValue[randomIndex]]
  } else {
    values = [identityValue]
  }

  // 查找第一个有对应图片的身份
  for (const val of values) {
    const label = IDENTITY_LABEL_MAP[val]
    if (label) {
      return IDENTITY_DIR + label + '.jpg'
    }
  }

  return DEFAULT_AVATAR
}

/**
 * 从联系人数据中提取头像路径并设置到联系人对象上
 * 注意：如果联系人已有 avatar（非空），说明已经固定过头像，不再重新随机选择
 * @param {Object} contact - 联系人对象
 * @returns {Object} 处理后的联系人对象（修改原对象）
 */
function processContactAvatar(contact) {
  if (!contact) return contact

  // 如果已有头像路径，说明已经固定过，直接使用
  if (contact.avatar && contact.avatar !== '') {
    return contact
  }

  // 优先使用 identities 数组
  if (contact.identities && Array.isArray(contact.identities) && contact.identities.length > 0) {
    contact.avatar = getIdentityAvatarPath(contact.identities)
  }
  // 兼容旧数据：使用 identity_labels 中文标签反向查找
  else if (contact.identity_labels && Array.isArray(contact.identity_labels)) {
    const value = findIdentityValueByLabel(contact.identity_labels)
    if (value) {
      contact.avatar = getIdentityAvatarPath([value])
    } else {
      contact.avatar = DEFAULT_AVATAR
    }
  }
  // 兼容旧数据：使用单个 identity_label
  else if (contact.identity_label) {
    const value = findIdentityValueByLabel([contact.identity_label])
    if (value) {
      contact.avatar = getIdentityAvatarPath([value])
    } else {
      contact.avatar = DEFAULT_AVATAR
    }
  }
  // 没有身份信息，使用默认头像
  else {
    contact.avatar = DEFAULT_AVATAR
  }

  return contact
}

/**
 * 根据中文标签反向查找身份值
 * @param {string[]} labels - 中文标签数组
 * @returns {string|null} 身份值
 */
function findIdentityValueByLabel(labels) {
  // 构建反向映射：label -> value
  const reverseMap = {}
  Object.keys(IDENTITY_LABEL_MAP).forEach(function(key) {
    reverseMap[IDENTITY_LABEL_MAP[key]] = key
  })

  for (const label of labels) {
    if (reverseMap[label]) {
      return reverseMap[label]
    }
  }
  return null
}

/**
 * 从联系人列表中批量处理头像
 * @param {Array} contacts - 联系人数组
 * @returns {Array} 处理后的联系人数组
 */
function processContactsAvatars(contacts) {
  if (!contacts || !Array.isArray(contacts)) return []
  return contacts.map(function(contact) {
    return processContactAvatar(contact)
  })
}

module.exports = {
  getIdentityAvatarPath,
  processContactAvatar,
  processContactsAvatars,
  findIdentityValueByLabel,
  DEFAULT_AVATAR,
  IDENTITY_LABEL_MAP
}