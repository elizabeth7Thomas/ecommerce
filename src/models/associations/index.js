import setupUserAssociations from './user.associations.js';
import setupProductAssociations from './product.associations.js';
import setupOrderAssociations from './order.associations.js';
import setupPaymentAssociations from './payment.associations.js';
import setupCRMAssociations from './crm.associations.js';
import setupInventoryAssociations from './inventory.associations.js';
import setupQuotationAssociations from './quotation.associations.js';
import setupReturnAssociations from './return.associations.js';

const setupAllAssociations = () => {
  console.log('🔗 Configurando asociaciones...');
  
  // Importar y ejecutar en orden específico
  setupUserAssociations();
  setupProductAssociations();
  setupOrderAssociations();
  setupPaymentAssociations();
  setupCRMAssociations();
  setupInventoryAssociations();
  setupQuotationAssociations();
  setupReturnAssociations();
  
  console.log('✅ Todas las asociaciones configuradas');
};

export default setupAllAssociations;