/**
 * Ijma Wallet — Node Configuration Context
 * Provides the active network provider config to all components.
 * Persists non-sensitive preferences to localStorage.
 * Sensitive credentials (macaroons, API keys) are session-only.
 */

import { createContext, useContext, useReducer, useEffect } from 'react'
import {
  loadNodeConfig, saveNodeConfig, DEFAULT_NODE_CONFIG,
  testExplorer, testPriceFeed,
} from '../lib/providers.js'

const NodeConfigContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, config: { ...state.config, ...action.payload } }
    case 'RESET':
      return { ...state, config: { ...DEFAULT_NODE_CONFIG } }
    case 'SET_TEST_RESULT':
      return {
        ...state,
        testResults: { ...state.testResults, [action.key]: action.result }
      }
    case 'SET_TESTING':
      return { ...state, testing: { ...state.testing, [action.key]: action.value } }
    default:
      return state
  }
}

export function NodeConfigProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    config: loadNodeConfig(),
    testResults: {},
    testing: {},
  })

  // Persist non-sensitive config on every change
  useEffect(() => {
    saveNodeConfig(state.config)
  }, [state.config])

  function setConfig(partial) {
    dispatch({ type: 'SET', payload: partial })
  }

  function resetConfig() {
    dispatch({ type: 'RESET' })
    localStorage.removeItem('ijma_node_config')
  }

  async function runTest(type) {
    dispatch({ type: 'SET_TESTING', key: type, value: true })
    try {
      let result
      if (type === 'explorer') result = await testExplorer(state.config)
      if (type === 'price') result = await testPriceFeed(state.config)
      dispatch({ type: 'SET_TEST_RESULT', key: type, result })
    } catch (e) {
      dispatch({ type: 'SET_TEST_RESULT', key: type, result: { ok: false, error: e.message } })
    } finally {
      dispatch({ type: 'SET_TESTING', key: type, value: false })
    }
  }

  return (
    <NodeConfigContext.Provider value={{
      config: state.config,
      testResults: state.testResults,
      testing: state.testing,
      setConfig,
      resetConfig,
      runTest,
    }}>
      {children}
    </NodeConfigContext.Provider>
  )
}

export function useNodeConfig() {
  const ctx = useContext(NodeConfigContext)
  if (!ctx) throw new Error('useNodeConfig must be inside NodeConfigProvider')
  return ctx
}
