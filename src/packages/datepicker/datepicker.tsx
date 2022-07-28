import React, { FunctionComponent, useState, useEffect, useRef } from 'react'
import Picker from '@/packages/picker'

export interface PickerOption {
  text: string | number
  value: string | number
  disabled?: string
  children?: PickerOption[]
  className?: string | number
}

interface pickerRefState {
  updateChooseValue: (
    index: number,
    value: string,
    cacheValueData: any[]
  ) => void
}

export interface DatePickerProps {
  modelValue: Date | null
  visible: boolean
  title: string
  type: string
  isShowChinese: boolean
  minuteStep: number
  minDate: Date
  maxDate: Date
  className?: string
  style?: React.CSSProperties
  formatter?: (type: string, option: PickerOption) => PickerOption
  onCloseDatePicker: () => void
  onConfirmDatePicker: (list: any[]) => void
}
const currentYear = new Date().getFullYear()
const defaultProps = {
  modelValue: null,
  visible: false,
  title: '',
  type: 'date',
  isShowChinese: false,
  minuteStep: 1,
  minDate: new Date(currentYear - 10, 0, 1),
  maxDate: new Date(currentYear + 10, 11, 31),
} as DatePickerProps

export const DatePicker: FunctionComponent<
  Partial<DatePickerProps> & React.HTMLAttributes<HTMLDivElement>
> = (props) => {
  const {
    minDate,
    maxDate,
    type,
    isShowChinese,
    minuteStep,
    modelValue,
    visible,
    title,
    formatter,
    onCloseDatePicker,
    onConfirmDatePicker,
    className,
    style,
    ...rest
  } = {
    ...defaultProps,
    ...props,
  }

  const [show, setShow] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [defaultValue, setDefaultValue] = useState<(string | number)[]>([])
  const [listData, setListData] = useState<any[]>([])
  const pickerRef = useRef<pickerRefState>(null)

  const isDate = (val: Date): val is Date => {
    return (
      Object.prototype.toString.call(val) === '[object Date]' &&
      !Number.isNaN(val.getTime())
    )
  }

  const zhCNType: { [key: string]: string } = {
    day: '日',
    year: '年',
    month: '月',
    hour: '时',
    minute: '分',
    seconds: '秒',
  }
  const formatValue = (value: Date | null) => {
    let cvalue = value
    if (!cvalue || (cvalue && !isDate(cvalue))) {
      cvalue = minDate
    }
    let timestmp = Math.max(cvalue.getTime(), minDate.getTime())
    timestmp = Math.min(timestmp, maxDate.getTime())

    return new Date(timestmp)
  }

  function getMonthEndDay(year: number, month: number): number {
    return new Date(year, month, 0).getDate()
  }
  const getBoundary = (type: string, value: Date) => {
    const boundary = type === 'min' ? minDate : maxDate
    const year = boundary.getFullYear()
    let month = 1
    let date = 1
    let hour = 0
    let minute = 0

    if (type === 'max') {
      month = 12
      date = getMonthEndDay(value.getFullYear(), value.getMonth() + 1)
      hour = 23
      minute = 59
    }
    const seconds = minute
    if (value.getFullYear() === year) {
      month = boundary.getMonth() + 1
      if (value.getMonth() + 1 === month) {
        date = boundary.getDate()
        if (value.getDate() === date) {
          hour = boundary.getHours()
          if (value.getHours() === hour) {
            minute = boundary.getMinutes()
          }
        }
      }
    }

    return {
      [`${type}Year`]: year,
      [`${type}Month`]: month,
      [`${type}Date`]: date,
      [`${type}Hour`]: hour,
      [`${type}Minute`]: minute,
      [`${type}Seconds`]: seconds,
    }
  }

  const ranges = (date?: Date) => {
    const curDate = date || currentDate
    if (!curDate) return []
    const { maxYear, maxDate, maxMonth, maxHour, maxMinute, maxSeconds } =
      getBoundary('max', curDate)

    const { minYear, minDate, minMonth, minHour, minMinute, minSeconds } =
      getBoundary('min', curDate)

    const result = [
      {
        type: 'year',
        range: [minYear, maxYear],
      },
      {
        type: 'month',
        range: [minMonth, maxMonth],
      },
      {
        type: 'day',
        range: [minDate, maxDate],
      },
      {
        type: 'hour',
        range: [minHour, maxHour],
      },
      {
        type: 'minute',
        range: [minMinute, maxMinute],
      },
      {
        type: 'seconds',
        range: [minSeconds, maxSeconds],
      },
    ]

    let start = 0
    let end = 0
    switch (type) {
      case 'date':
        start = 0
        end = 3
        break
      case 'datetime':
        start = 0
        end = 5
        break
      case 'time':
        start = 3
        end = 6
        break
      case 'month-day':
        start = 1
        end = 3
        break
      case 'datehour':
        start = 0
        end = 4
        break
      default:
        start = 0
        end = 0
    }
    return result.slice(start, end)
  }

  const initDefault = () => {
    if (['date', 'datetime', 'time'].includes(type) && modelValue) {
      const formatDate = [
        modelValue.getFullYear(),
        modelValue.getMonth() + 1,
        modelValue.getDate(),
        modelValue.getHours(),
        modelValue.getMinutes(),
        modelValue.getSeconds(),
      ]
      const [year, month, hour, minute, seconds] = formatDate
      let [day] = formatDate

      day = Math.min(day, getMonthEndDay(year, month))
      let val: (string | number)[] = formatDate
      if (isShowChinese) {
        val = [
          year + zhCNType.year,
          month + zhCNType.month,
          day + zhCNType.day,
          hour + zhCNType.hour,
          minute + zhCNType.minute,
          seconds + zhCNType.seconds,
        ]
      }
      if (type === 'date') {
        setDefaultValue(val.splice(0, 3))
      } else if (type === 'datetime') {
        setDefaultValue(val.splice(0, 5))
      } else if (type === 'time') {
        setDefaultValue(val.splice(3, 3))
      }
    }
  }

  const updateChooseValueCustmer = (
    index: number,
    selectedValue: (number | string)[],
    cacheValueData: PickerOption[]
  ) => {
    console.log('滨化', index, selectedValue, cacheValueData)

    if (
      ['date', 'datetime', 'datehour', 'month-day', 'year-month'].includes(type)
    ) {
      const formatDate: (number | string)[] = []
      selectedValue.forEach((item) => {
        formatDate.push(item)
      })
      if (props.type === 'month-day' && formatDate.length < 3) {
        formatDate.unshift(new Date(minDate || maxDate).getFullYear())
      }

      if (props.type === 'year-month' && formatDate.length < 3) {
        formatDate.push(new Date(minDate || maxDate).getDate())
      }

      const year = Number(formatDate[0])
      const month = Number(formatDate[1]) - 1
      const day = Math.min(
        Number(formatDate[2]),
        getMonthEndDay(Number(formatDate[0]), Number(formatDate[1]))
      )
      let date: Date | null = null
      if (
        props.type === 'date' ||
        props.type === 'month-day' ||
        props.type === 'year-month'
      ) {
        date = new Date(year, month, day)
      } else if (props.type === 'datetime') {
        date = new Date(
          year,
          month,
          day,
          Number(formatDate[3]),
          Number(formatDate[4])
        )
      } else if (props.type === 'datehour') {
        date = new Date(year, month, day, Number(formatDate[3]))
      }

      console.log(11, date)
      date && setCurrentDate(formatValue(date as Date))
    }
  }

  const padZero = (num: number | string, targetLength = 2) => {
    let str = `${num}`
    while (str.length < targetLength) {
      str = `0${str}`
    }
    return str
  }

  const formatterOption = (type: string, value: string | number) => {
    let fOption = null
    if (formatter) {
      fOption = formatter(type, {
        text: padZero(value, 2),
        value: padZero(value, 2),
      })
    } else {
      const padMin = padZero(value, 2)
      const fatter = isShowChinese ? zhCNType[type] : ''
      fOption = { text: padMin + fatter, value: padMin }
    }

    return fOption
  }

  const generateValue = (
    min: number,
    max: number,
    val: number | string,
    type: string,
    columnIndex: number
  ) => {
    let cmin = min
    const arr: Array<PickerOption> = []
    let index = 0
    while (cmin <= max) {
      arr.push(formatterOption(type, cmin))

      if (type === 'minute') {
        cmin += minuteStep
      } else {
        cmin++
      }

      if (cmin <= val) {
        index++
      }
    }

    defaultValue[columnIndex] = arr[index].value
    setDefaultValue([...defaultValue])

    return arr
  }

  const getDateIndex = (type: string) => {
    if (!currentDate) return 0

    let d = 0
    if (type === 'year') {
      d = (currentDate as Date).getFullYear()
    } else if (type === 'month') {
      d = (currentDate as Date).getMonth() + 1
    } else if (type === 'day') {
      d = (currentDate as Date).getDate()
    } else if (type === 'hour') {
      d = (currentDate as Date).getHours()
    } else if (type === 'minute') {
      d = (currentDate as Date).getMinutes()
    } else if (type === 'seconds') {
      d = (currentDate as Date).getSeconds()
    }

    return d
  }

  const columns = (date?: Date) => {
    const val = ranges(date).map((res, columnIndex) => {
      return generateValue(
        res.range[0],
        res.range[1],
        getDateIndex(res.type),
        res.type,
        columnIndex
      )
    })
    return val || []
  }

  useEffect(() => {
    setCurrentDate(formatValue(modelValue))
    // setListData(columns())
    // initDefault()
  }, [])

  useEffect(() => {
    setShow(visible)
  }, [visible])

  useEffect(() => {
    console.log('datepicker listdate 更新')
  }, [listData])

  useEffect(() => {
    if (currentDate) {
      console.log('currentDate 更新')
      setListData(columns())
    }
  }, [currentDate])

  useEffect(() => {
    console.log('picker设置值', defaultValue)
  }, [defaultValue])

  return (
    <div
      className={`nut-datepicker ${className || ''}`}
      style={style}
      {...rest}
    >
      {listData.length > 0 && (
        <Picker
          isVisible={show}
          listData={listData}
          onClose={onCloseDatePicker}
          defaultValueData={defaultValue}
          onConfirm={(list: any[]) =>
            onConfirmDatePicker && onConfirmDatePicker(list)
          }
          onChange={(
            index: number,
            value: (number | string)[],
            list: PickerOption[]
          ) => updateChooseValueCustmer(index, value, list)}
          ref={pickerRef}
        />
      )}
    </div>
  )
}

DatePicker.defaultProps = defaultProps
DatePicker.displayName = 'NutDatePicker'
