import { API_BASE_URL, createMockImage, getImageUrl, hasRemoteApiConfig } from '@/utils/api'

type GoodsItem = {
  id: string
  title: string
  description: string
  price: number
  category: string
  contact: string
  image_url: string
  seller_id?: string
  seller_nickname: string
  created_at: string
  latitude?: number | null
  longitude?: number | null
}

type UserItem = {
  id: string
  username: string
  nickname: string
  password: string
  contact: string
}

const MOCK_USERS_KEY = 'mock_users'
const MOCK_GOODS_KEY = 'mock_goods'
const MOCK_TOKEN_PREFIX = 'mock-token:'

const defaultUsers: UserItem[] = [
  {
    id: 'u-demo',
    username: 'demo01',
    nickname: '演示用户',
    password: '123456',
    contact: 'demo01@campus.test'
  }
]

const defaultGoods: GoodsItem[] = [
  {
    id: 'g-1',
    title: '高等数学教材 9成新',
    description: '同济版高数教材，上课有少量笔记，适合大一学生复习使用。',
    price: 18,
    category: '图书教材',
    contact: 'demo01@campus.test',
    image_url: createMockImage('高数教材', '#d6eadf', '#2d6a4f'),
    seller_id: 'u-demo',
    seller_nickname: '演示用户',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    latitude: null,
    longitude: null
  },
  {
    id: 'g-2',
    title: '二手蓝牙耳机',
    description: '音质正常，续航稳定，附充电线。',
    price: 66,
    category: '数码产品',
    contact: 'demo01@campus.test',
    image_url: createMockImage('蓝牙耳机', '#dceefe', '#0b6e99'),
    seller_nickname: '小林',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    latitude: null,
    longitude: null
  },
  {
    id: 'g-3',
    title: '宿舍收纳架',
    description: '铁艺三层收纳架，适合宿舍桌面整理。',
    price: 25,
    category: '生活用品',
    contact: 'contact@campus.test',
    image_url: createMockImage('收纳架', '#f6e7d7', '#9c6644'),
    seller_nickname: '阿青',
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    latitude: null,
    longitude: null
  }
]

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

const readStorage = <T>(key: string, fallback: T): T => {
  const data = uni.getStorageSync(key)
  return data || fallback
}

const writeStorage = <T>(key: string, value: T) => {
  uni.setStorageSync(key, value)
}

const ensureUsers = (): UserItem[] => {
  const users = readStorage<UserItem[]>(MOCK_USERS_KEY, [])
  if (users.length) return users
  writeStorage(MOCK_USERS_KEY, defaultUsers)
  return [...defaultUsers]
}

const ensureGoods = (): GoodsItem[] => {
  const goods = readStorage<GoodsItem[]>(MOCK_GOODS_KEY, [])
  if (goods.length) return goods
  writeStorage(MOCK_GOODS_KEY, defaultGoods)
  return [...defaultGoods]
}

const saveUsers = (users: UserItem[]) => writeStorage(MOCK_USERS_KEY, users)
const saveGoods = (goods: GoodsItem[]) => writeStorage(MOCK_GOODS_KEY, goods)

const buildMockToken = (userId: string) => `${MOCK_TOKEN_PREFIX}${userId}`

const parseMockToken = (token?: string): string => {
  if (!token || !token.startsWith(MOCK_TOKEN_PREFIX)) return ''
  return token.slice(MOCK_TOKEN_PREFIX.length)
}

const getToken = () => uni.getStorageSync('token') as string

export const isMockMode = () => !hasRemoteApiConfig

export const getCurrentUser = () => uni.getStorageSync('userInfo') || null

const request = <T>(options: UniApp.RequestOptions) => {
  return new Promise<UniApp.RequestSuccessCallbackResult & { data: T }>((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => resolve(res as UniApp.RequestSuccessCallbackResult & { data: T }),
      fail: reject
    })
  })
}

const upload = (filePath: string) => {
  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/api/upload`,
      filePath,
      name: 'image',
      header: {
        Authorization: `Bearer ${getToken() || ''}`
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          resolve(getImageUrl(data.url || filePath))
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  })
}

export const fetchGoodsList = async (params: {
  page: number
  per_page: number
  keyword?: string
  category?: string
  sort?: string
}) => {
  if (!isMockMode()) {
    const res = await request<{ data: { items: GoodsItem[]; total: number } }>({
      url: `${API_BASE_URL}/api/goods`,
      method: 'GET',
      data: params,
      header: {
        Authorization: `Bearer ${getToken() || ''}`
      }
    })
    return res.data.data
  }

  await delay()
  const keyword = (params.keyword || '').trim().toLowerCase()
  const category = params.category || ''
  let items = ensureGoods().slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  if (keyword) {
    items = items.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(keyword))
  }
  if (category) {
    items = items.filter((item) => item.category === category)
  }
  const start = (params.page - 1) * params.per_page
  const end = start + params.per_page
  return {
    items: items.slice(start, end),
    total: items.length
  }
}

export const fetchGoodsDetail = async (id: string) => {
  if (!isMockMode()) {
    const res = await request<{ data: GoodsItem & { is_favorited?: boolean } }>({
      url: `${API_BASE_URL}/api/goods/${id}`,
      header: {
        Authorization: `Bearer ${getToken() || ''}`
      }
    })
    return res.data.data
  }

  await delay()
  const goods = ensureGoods().find((item) => item.id === id)
  if (!goods) return null
  return {
    ...goods,
    is_favorited: false
  }
}

export const loginUser = async (payload: { username: string; password: string }) => {
  if (!isMockMode()) {
    const res = await request<{ data: { token: string; user: Record<string, any> } }>({
      url: `${API_BASE_URL}/api/auth/login`,
      method: 'POST',
      data: payload
    })
    return res.data.data
  }

  await delay()
  const users = ensureUsers()
  const user = users.find((item) => item.username === payload.username && item.password === payload.password)
  if (!user) {
    throw new Error('用户名或密码错误')
  }

  const result = {
    token: buildMockToken(user.id),
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      contact: user.contact
    }
  }
  uni.setStorageSync('token', result.token)
  uni.setStorageSync('userInfo', result.user)
  return result
}

export const registerUser = async (payload: { username: string; nickname: string; password: string }) => {
  if (!isMockMode()) {
    const res = await request<{ message?: string }>({
      url: `${API_BASE_URL}/api/auth/register`,
      method: 'POST',
      data: payload
    })
    return { statusCode: res.statusCode, message: (res.data as { message?: string })?.message }
  }

  await delay()
  const users = ensureUsers()
  if (users.some((item) => item.username === payload.username)) {
    throw new Error('用户名已存在')
  }
  users.push({
    id: `u-${Date.now()}`,
    username: payload.username,
    nickname: payload.nickname,
    password: payload.password,
    contact: `${payload.username}@campus.test`
  })
  saveUsers(users)
  return { statusCode: 201, message: '注册成功' }
}

export const uploadImage = async (filePath: string) => {
  if (isMockMode()) {
    await delay(80)
    return filePath
  }
  return upload(filePath)
}

export const createGoods = async (payload: {
  title: string
  description: string
  price: number
  category: string
  contact: string
  imageUrl: string
  latitude: number | null
  longitude: number | null
}) => {
  if (!isMockMode()) {
    const res = await request({
      url: `${API_BASE_URL}/api/goods`,
      method: 'POST',
      data: payload,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken() || ''}`
      }
    })
    return res.statusCode
  }

  await delay()
  const tokenUserId = parseMockToken(getToken())
  const currentUser = getCurrentUser()
  const seller = tokenUserId ? ensureUsers().find((item) => item.id === tokenUserId) : null
  if (!seller && !currentUser) {
    throw new Error('请先登录后再发布')
  }

  const goods = ensureGoods()
  goods.unshift({
    id: `g-${Date.now()}`,
    title: payload.title,
    description: payload.description,
    price: payload.price,
    category: payload.category,
    contact: payload.contact,
    image_url: payload.imageUrl,
    seller_id: seller?.id || currentUser?.id || '',
    seller_nickname: seller?.nickname || currentUser?.nickname || '匿名用户',
    created_at: new Date().toISOString(),
    latitude: payload.latitude,
    longitude: payload.longitude
  })
  saveGoods(goods)
  return 201
}

export const fetchUserProfile = async () => {
  if (!isMockMode()) {
    const res = await request<{ data: Record<string, any> }>({
      url: `${API_BASE_URL}/api/user/profile`,
      header: {
        Authorization: `Bearer ${getToken() || ''}`
      }
    })
    return res.data.data
  }

  await delay()
  const tokenUserId = parseMockToken(getToken())
  const user = ensureUsers().find((item) => item.id === tokenUserId)
  const currentUser = getCurrentUser()
  if (!user && !currentUser) {
    throw new Error('未登录')
  }

  const nickname = user?.nickname || currentUser.nickname || '未命名用户'
  const userId = user?.id || currentUser.id || ''
  const goodsCount = ensureGoods().filter((item) => {
    if (userId && item.seller_id) return item.seller_id === userId
    return item.seller_nickname === nickname
  }).length
  return {
    id: userId,
    nickname,
    goods_count: goodsCount,
    favorite_count: 0
  }
}
