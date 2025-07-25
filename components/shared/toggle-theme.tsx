"use client"
import { useTheme } from 'next-themes'
import React from 'react'
import { Button } from '../ui/button'
import { WiMoonAltFirstQuarter } from 'react-icons/wi'

export default function ToggleTheme() {
    const {theme ,setTheme} = useTheme()
  return (
    <div>
      <Button onClick={()=>setTheme(theme === 'light' ? 'dark' : 'light')}><WiMoonAltFirstQuarter/></Button>
    </div>
  )
}
