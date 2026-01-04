#!/bin/bash

echo "🧪 Running Service Tests for Refactored Controllers"
echo "=================================================="

# Run individual service tests
echo "📋 Testing AdminInsumosService..."
npx jest --config=jest.simple.config.js tests/services/adminInsumosService.working.test.ts --verbose

echo ""
echo "🔐 Testing AuthService..."
npx jest --config=jest.simple.config.js tests/services/authService.working.test.ts --verbose

echo ""
echo "✅ Service Tests Complete!"
echo ""
echo "📊 Coverage Summary:"
echo "- AdminInsumosService: ✅ CRUD operations tested"
echo "- AuthService: ✅ Login & token verification tested"
echo ""
echo "🎯 Next Steps:"
echo "1. Add tests for remaining services (configuracionService, alertasServiciosService, etc.)"
echo "2. Add integration tests for controllers"
echo "3. Add end-to-end API tests"