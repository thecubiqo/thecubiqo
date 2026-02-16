import{A as s}from"./AuthButton.client-BuA0g3F6.js";import"./jsx-runtime-C5WNSv3b.js";import"./AuthContext-fAsePHUy.js";import"./index-ukwzBNUP.js";import"./base64url-YC0aElVo.js";const l={title:"Components/AuthButton",component:s,parameters:{layout:"centered",backgrounds:{default:"dark",values:[{name:"dark",value:"#000000"},{name:"light",value:"#ffffff"}]}},tags:["autodocs"],argTypes:{isDark:{control:"boolean",description:"Whether to use a dark theme variant"},onSignInClick:{action:"sign-in clicked"},onUserClick:{action:"user avatar clicked"}}},e={args:{isDark:!0}},r={args:{isDark:!1},parameters:{backgrounds:{default:"light"}}},a={args:{isDark:!0,onSignInClick:()=>console.log("Sign in clicked"),onUserClick:()=>console.log("User clicked")}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    isDark: true
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    isDark: false
  },
  parameters: {
    backgrounds: {
      default: 'light'
    }
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    isDark: true,
    onSignInClick: () => console.log('Sign in clicked'),
    onUserClick: () => console.log('User clicked')
  }
}`,...a.parameters?.docs?.source}}};const u=["Default","LightTheme","WithCallbacks"];export{e as Default,r as LightTheme,a as WithCallbacks,u as __namedExportsOrder,l as default};
