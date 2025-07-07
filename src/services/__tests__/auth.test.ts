import { describe, it, expect } from 'vitest'
import { 
  validatePassword, 
  validateEmail, 
  isTemporaryEmail 
} from '../auth'

describe('Auth Service', () => {
  describe('validatePassword', () => {
    it('deve rejeitar senhas muito curtas', () => {
      const result = validatePassword('123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Senha deve ter pelo menos 8 caracteres')
      expect(result.strength).toBe('weak')
    })

    it('deve rejeitar senhas sem letras minúsculas', () => {
      const result = validatePassword('PASSWORD123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra minúscula')
    })

    it('deve rejeitar senhas sem letras maiúsculas', () => {
      const result = validatePassword('password123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra maiúscula')
    })

    it('deve rejeitar senhas sem números', () => {
      const result = validatePassword('Password!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Senha deve conter pelo menos um número')
    })

    it('deve rejeitar senhas sem caracteres especiais', () => {
      const result = validatePassword('Password123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Senha deve conter pelo menos um caractere especial')
    })

    it('deve aceitar senhas que atendem aos critérios básicos', () => {
      const result = validatePassword('Password123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(['medium', 'strong']).toContain(result.strength)
    })

    it('deve classificar como forte senhas longas e complexas', () => {
      const result = validatePassword('SuperSecurePassword123!')
      expect(result.isValid).toBe(true)
      expect(result.strength).toBe('strong')
      expect(result.score).toBeGreaterThanOrEqual(6)
    })

    it('deve calcular score corretamente', () => {
      const weak = validatePassword('abc')
      const medium = validatePassword('Password123!')
      const strong = validatePassword('SuperSecurePassword123!')
      
      expect(weak.score).toBeLessThan(medium.score)
      expect(medium.score).toBeLessThanOrEqual(strong.score)
    })
  })

  describe('validateEmail', () => {
    it('deve aceitar emails válidos', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@company.co.uk',
        'firstname.lastname@subdomain.domain.com'
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('deve rejeitar emails inválidos', () => {
      const invalidEmails = [
        'invalid',
        'user@',
        '@domain.com',
        'user..double.dot@domain.com',
        'user@domain',
        'user name@domain.com',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })
  })

  describe('isTemporaryEmail', () => {
    it('deve detectar emails temporários', () => {
      const temporaryEmails = [
        'user@10minutemail.com',
        'test@tempmail.org',
        'fake@guerrillamail.com',
        'spam@mailinator.com',
        'throwaway@yopmail.com'
      ]

      temporaryEmails.forEach(email => {
        expect(isTemporaryEmail(email)).toBe(true)
      })
    })

    it('deve aceitar emails de domínios legítimos', () => {
      const legitimateEmails = [
        'user@gmail.com',
        'test@outlook.com',
        'work@company.com',
        'student@university.edu',
        'contact@organization.org'
      ]

      legitimateEmails.forEach(email => {
        expect(isTemporaryEmail(email)).toBe(false)
      })
    })

    it('deve ser case insensitive', () => {
      expect(isTemporaryEmail('user@TEMPMAIL.ORG')).toBe(true)
      expect(isTemporaryEmail('user@TempMail.Org')).toBe(true)
    })
  })

  describe('Password Strength Edge Cases', () => {
    it('deve lidar com senha vazia', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.strength).toBe('weak')
      expect(result.score).toBe(0)
    })

    it('deve lidar com caracteres especiais variados', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', "'", ':', '"', '\\', '|', ',', '.', '<', '>', '?']
      
      specialChars.forEach(char => {
        const password = `Password123${char}`
        const result = validatePassword(password)
        expect(result.isValid).toBe(true)
      })
    })

    it('deve dar pontuação extra para senhas muito longas', () => {
      const longPassword = 'ThisIsAVeryLongPasswordThatShouldGetExtraPoints123!'
      const shortPassword = 'Short123!'
      
      const longResult = validatePassword(longPassword)
      const shortResult = validatePassword(shortPassword)
      
      expect(longResult.score).toBeGreaterThan(shortResult.score)
    })
  })

  describe('Email Validation Edge Cases', () => {
    it('deve lidar com emails com múltiplos pontos', () => {
      expect(validateEmail('user.name.surname@domain.co.uk')).toBe(true)
      expect(validateEmail('user..double@domain.com')).toBe(false)
    })

    it('deve lidar com caracteres especiais permitidos', () => {
      expect(validateEmail('user+tag@domain.com')).toBe(true)
      expect(validateEmail('user-name@domain.com')).toBe(true)
      expect(validateEmail('user_name@domain.com')).toBe(true)
    })

    it('deve rejeitar emails com espaços', () => {
      expect(validateEmail('user name@domain.com')).toBe(false)
      expect(validateEmail('user@domain name.com')).toBe(false)
    })
  })
}) 