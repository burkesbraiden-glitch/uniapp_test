import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGoodsList } from '@/utils/service'

export const useGoodsStore = defineStore('goods', () => {
  const list = ref<any[]>([])
  const page = ref(1)
  const total = ref(0)
  const loading = ref(false)
  const keyword = ref('')
  const category = ref('')
  const sort = ref('created_at_desc')
  const perPage = ref(10)

  const fetchGoods = async (refresh = false) => {
    if (loading.value && !refresh) return
    loading.value = true

    if (refresh) {
      page.value = 1
    }

    try {
      const data = await fetchGoodsList({
        page: page.value,
        per_page: perPage.value,
        keyword: keyword.value,
        category: category.value,
        sort: sort.value
      })

      if (refresh) {
        list.value = data.items
      } else {
        list.value.push(...data.items)
      }
      total.value = data.total
      page.value++
    } catch (error) {
      console.error('获取商品列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const setKeyword = (kw: string) => {
    keyword.value = kw
  }

  const setCategory = (cat: string) => {
    category.value = cat
  }

  const setSort = (s: string) => {
    sort.value = s
  }

  return {
    list,
    page,
    total,
    loading,
    keyword,
    category,
    sort,
    perPage,
    fetchGoods,
    setKeyword,
    setCategory,
    setSort
  }
})
